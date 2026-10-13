# Tnalp: Plant Store

Shared vocabulary for plant sales, ordering, and payment-slip review in Tnalp. Use these terms consistently in documentation and communication. See [CONTEXT.md](./CONTEXT.md) for system details.

## Users

**User**:
A registered store account that may belong to a Customer or an Admin.
_Avoid_: Customer when referring to every type of account.

**Customer**:
A person buying or ordering Products from the store. This is the User's role in the purchasing process.
_Avoid_: Client, Member when referring to a buyer.

**Admin**:
A User with permission to manage Products, Users, and Orders, including reviewing payment slips and confirming order statuses.
_Avoid_: Seller, Owner, as the store does not define these as separate roles.

## Products

**Product**:
A plant or catalog entry offered for sale, with a price, description, image, and stock count.
_Avoid_: Plant when referring to a catalog entry; Item unless referring to a Cart Item or Order Item.

**Category**:
A group used to classify Products and help Customers find them.
_Avoid_: Collection, Tag.

**Stock**:
The number of units of a Product remaining for sale.
_Avoid_: Reservation, as remaining stock does not imply reserved units.

**Review**:
A User's comment and score for a Product.
_Avoid_: Verified Purchase, as a Review does not confirm that its author purchased the Product.

**Rating**:
The average score from a Product's Reviews, summarizing reviewers' opinions.
_Avoid_: Review when referring to the average score.

## Ordering

**Cart**:
The Products and quantities a Customer selects before confirming an Order.
_Avoid_: Order, Wishlist.

**Cart Item**:
A Product and its selected quantity in a Cart.
_Avoid_: Order Item before the Order is confirmed.

**Checkout**:
The process of entering a Shipping Address, choosing a Payment Method, reviewing totals, and confirming an Order.
_Avoid_: Payment, as Checkout does not imply successful payment.

**Order**:
A purchase request confirmed by a Customer, containing Order Items, the customer, a Shipping Address, totals, and processing statuses.
_Avoid_: Cart, Transaction, Invoice.

**Order Item**:
A Product listed in an Order, with its quantity and unit price at the time of ordering.
_Avoid_: Product when referring specifically to the recorded purchase details.

**Shipping Address**:
The recipient and delivery location for an Order, including name, phone number, street address, district, province, and postal code.
_Avoid_: Billing Address, Profile Address.

**Items Price**:
The sum of all item prices multiplied by their quantities in an Order, before shipping charges.
_Avoid_: Total Price when shipping is not included.

**Shipping Price**:
The charge for delivering an Order to its recipient.
_Avoid_: Items Price.

**Total Price**:
Items Price plus Shipping Price, representing the amount due for an Order.
_Avoid_: Revenue, Paid Amount, as an order total does not confirm that the store received money.

## Payment and Statuses

**Payment Method**:
The channel a Customer selects to pay for an Order. This demo store uses PromptPay.
_Avoid_: Payment Status.

**Payment Slip**:
An image of transfer evidence submitted by a Customer for the store to review.
_Avoid_: Receipt, Payment Confirmation, as submitting a slip does not confirm receipt of payment.

**Uploaded**:
The status indicating that an Order has an attached Payment Slip ready for review.
_Avoid_: Paid, Verified.

**Paid**:
The status recording that payment for an Order has been confirmed through manual review.
_Avoid_: Uploaded, Automatically Verified.

**Delivered**:
The status recording that an Order's Products have been delivered to the recipient.
_Avoid_: Shipped, Dispatched, as the store does not define a separate in-transit status.

**Canceled**:
The status recording that processing of an Order has been canceled.
_Avoid_: Deleted, Refunded, as cancellation does not imply order deletion or a refund.
