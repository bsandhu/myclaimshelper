Overview

A claimEntry (Task) includes one or more BillingItems.
BillingItems link to one and only one ClaimEntry, and one and only one Bill.

           +-------+       
    +----> | Claim | <--+   
    |      +-------+    |   
    |                   |   
+---+------+        +---+--+
|ClaimEntry|        | Bill |
+----------+        +------+
    ^                   ^   
    |                   |   
    | +--------------+  |   
    +-+ BillingItem  +--+   
      +--------------+      


Bill
----

Attributes
~~~~~~~~~~
- claimId     
- description
- billingItems*

API
~~~
Get all Bills, including BillingItems.
:: get -> [BillObj]
'/bill'

Get a Bill with all its BillingItems.
:: get, String id -> BillObj
'/bill/:id'


BillingItem
-----------

Attributes
~~~~~~~~~~
- claimEntryId
- billId
- description
- mileage
- time
- expenseType
- expenseAmount

API
~~~
Save or update one or more billingItem
If the payload is a list of items, save them all. 
:: post, [BillingtItem] -> status
'/billingItem'

Get a BillingItem
:: get, String id -> BillingItem
'/billingItem/:id'

Get all BillingItems belonging to a given ClaimEntry
:: get, String id -> [BillingItem]
'/billingItem/claimEntry/:id'

