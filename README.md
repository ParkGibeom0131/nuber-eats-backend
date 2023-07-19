# Nuber Eats

The Backend of Nuber Eats Clone

## User Model

- id
- createdAt
- updatedAt

- email
- password
- role(client | owner | delivery)

## User CRUD

- Create Account [✅]
- Log In [✅]
- See Profile [✅]
- Edit Profile [✅]
- Verify Email [✅]

## Restaurant Model

- name
- category
- address
- coverImage

## Restaurant CRUD

- Edit Restaurant [✅]
- Delete Restaurant [✅]

- See Categories [✅]
- See Restaurants by Category (pagination) [✅]
- See Restaurants (pagination) [✅]
- See Restaurant [✅]
- Search Restaurant [✅]

## Dish CRUD

- Create Dish [✅]
- Edit Dish [✅]
- Delete Dish [✅]

## Orders CRUD

- Orders CRUD [✅]
- Orders Subscription (Owner, Customer, Delivery) [✅]:

  - Pending Orders (Owner)/ (subscription: newOrder) (trigger: createOrder(newOrder)) [✅]
  - Pending Pickup Order (Delivery)/ (subscription: orderUpdate) (trigger: editOrder(orderUpdate)) [✅]
  - Order Status (Customer, Delivery, Owner)/ (subscription: orderUpdate) (trigger: editOrder(orderUpdate)) [✅]

- Add Driver to Order [✅]

## Payments (CRON)
