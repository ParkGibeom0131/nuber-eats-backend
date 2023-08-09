import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { Repository } from 'typeorm';
import { User, UserRole } from 'src/users/entities/user.entity';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { OrderItem } from './entities/order-item.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import {
  NEW_COOKED_ORDER,
  NEW_ORDER_UPDATE,
  NEW_PENDING_ORDER,
  PUB_SUB,
} from 'src/common/common.constants';
import { PubSub } from 'graphql-subscriptions';
import { TakeOrderInput, TakeOrderOutput } from './dtos/take-order.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItems: Repository<OrderItem>,
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>,
    @Inject(PUB_SUB) private readonly pubSub: PubSub
  ) {}

  async createOrder(
    customer: User,
    { restaurantId, items }: CreateOrderInput
  ): Promise<CreateOrderOutput> {
    try {
      const restaurant = await this.restaurants.findOne({
        where: { id: restaurantId },
      });
      if (!restaurant) {
        return {
          ok: false,
          error: '음식점을 찾을 수 없습니다.',
        };
      }
      let orderFinalPrice = 0;
      const orderItems: OrderItem[] = [];
      for (const item of items) {
        const dish = await this.dishes.findOne({ where: { id: item.dishId } });
        if (!dish) {
          return {
            ok: false,
            error: '음식을 찾을 수 없습니다.',
          };
        }
        let dishFinalPrice = dish.price;
        for (const itemOption of item.options) {
          const dishOption = dish.options.find(
            (dishOption) => dishOption.name === itemOption.name
          );
          if (dishOption) {
            if (dishOption.extra) {
              dishFinalPrice = dishFinalPrice + dishOption.extra;
            } else {
              const dishOptionChoice = dishOption.choices?.find(
                (optionChoice) => optionChoice.name === itemOption.choice
              );
              if (dishOptionChoice) {
                if (dishOptionChoice.extra) {
                  dishFinalPrice = dishFinalPrice + dishOptionChoice.extra;
                }
              }
            }
          }
        }
        orderFinalPrice = orderFinalPrice + dishFinalPrice;
        const orderItem = await this.orderItems.save(
          this.orderItems.create({
            dish,
            options: item.options,
          })
        );
        orderItems.push(orderItem);
      }

      const order = await this.orders.save(
        this.orders.create({
          customer,
          restaurant,
          total: orderFinalPrice,
          items: orderItems,
        })
      );
      await this.pubSub.publish(NEW_PENDING_ORDER, {
        pendingOrders: { order, ownerId: restaurant.ownerId },
      });
      return {
        ok: true,
        orderId: order.id,
      };
    } catch (error) {
      return {
        ok: false,
        error: '주문을 할 수 없습니다.',
      };
    }
  }

  async getOrders(
    user: User,
    { status }: GetOrdersInput
  ): Promise<GetOrdersOutput> {
    try {
      let orders: Order[];
      if (user.role === UserRole.Client) {
        orders = await this.orders.find({
          where: {
            customer: { id: user.id },
            ...(status && { status }),
          },
        });
      } else if (user.role === UserRole.Delivery) {
        orders = await this.orders.find({
          where: {
            driver: { id: user.id },
            ...(status && { status }),
          },
        });
      } else if (user.role === UserRole.Owner) {
        const restaurants = await this.restaurants.find({
          where: {
            owner: { id: user.id },
          },
          relations: ['orders'],
        });
        orders = restaurants.map((restaurant) => restaurant.orders).flat(1);
        if (status) {
          // map은 새로운 배열을 생성하고, filter는 조건을 충족시키지 못하는 요소를 제거
          orders = orders.filter((order) => order.status === status);
        }
      }
      return {
        ok: true,
        orders,
      };
    } catch (error) {
      return {
        ok: false,
        error: '주문목록을 불러올 수 없습니다.',
      };
    }
  }

  allowedOrder(user: User, order: Order): boolean {
    let allowed = true;
    if (user.role === UserRole.Client && order.customerId !== user.id) {
      allowed = false;
    }
    if (user.role === UserRole.Delivery && order.driverId !== user.id) {
      allowed = false;
    }
    if (user.role === UserRole.Owner && order.restaurant.ownerId !== user.id) {
      allowed = false;
    }
    return allowed;
  }

  async getOrder(
    user: User,
    { id: orderId }: GetOrderInput
  ): Promise<GetOrderOutput> {
    try {
      const order = await this.orders.findOne({
        where: { id: orderId },
        relations: ['restaurant'],
      });
      if (!order) {
        return {
          ok: false,
          error: '주문을 찾을 수 없습니다.',
        };
      }

      if (!this.allowedOrder(user, order)) {
        return {
          ok: false,
          error: '주문목록을 볼 수 없습니다.',
        };
      }
      return {
        ok: true,
        order,
      };
    } catch (error) {
      return {
        ok: false,
        error: '주문목록을 불러올 수 없습니다.',
      };
    }
  }

  async editOrder(
    user: User,
    { id: orderId, status }: EditOrderInput
  ): Promise<EditOrderOutput> {
    try {
      const order = await this.orders.findOne({
        where: { id: orderId },
      });

      if (!order) {
        return {
          ok: false,
          error: '주문을 찾을 수 없습니다.',
        };
      }
      if (!this.allowedOrder(user, order)) {
        return {
          ok: false,
          error: '주문목록을 볼 수 없습니다.',
        };
      }

      let canEdit = true;
      // user가 Client면 수정할 수 없음
      if (user.role === UserRole.Client) {
        canEdit = false;
      }
      // user가 Owner인데 status가 Cooking, Cooked가 아니면 수정할 수 없음
      if (user.role === UserRole.Owner) {
        if (status !== OrderStatus.Cooking && status !== OrderStatus.Cooked) {
          canEdit = false;
        }
      }
      // user가 Delivery인데 status가 PickedUp, Delivered가 아니면 수정할 수 없음
      if (user.role === UserRole.Delivery) {
        if (
          status !== OrderStatus.PickedUp &&
          status !== OrderStatus.Delivered
        ) {
          canEdit = false;
        }
      }
      if (!canEdit) {
        return {
          ok: false,
          error: '권한이 없습니다.',
        };
      }
      await this.orders.save({
        id: orderId,
        status,
      });
      const newOrder = { ...order, status };
      if (user.role === UserRole.Owner) {
        if (status === OrderStatus.Cooked) {
          await this.pubSub.publish(NEW_COOKED_ORDER, {
            cookedOrders: newOrder,
          });
        }
      }

      await this.pubSub.publish(NEW_ORDER_UPDATE, { orderUpdates: newOrder });

      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: '주문을 수정할 수 없습니다.',
      };
    }
  }

  async takeOrder(
    driver: User,
    { id: orderId }: TakeOrderInput
  ): Promise<TakeOrderOutput> {
    try {
      const order = await this.orders.findOne({ where: { id: orderId } });
      if (!order) {
        return {
          ok: false,
          error: '주문을 확인할 수 없습니다.',
        };
      }
      if (order.driver) {
        return {
          ok: false,
          error: '이미 배정이 되었습니다.',
        };
      }

      await this.orders.save({
        id: orderId,
        driver,
      });

      await this.pubSub.publish(NEW_ORDER_UPDATE, {
        orderUpdates: { ...order, driver },
      });

      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: '주문을 업데이트 할 수 없습니다.',
      };
    }
  }
}
