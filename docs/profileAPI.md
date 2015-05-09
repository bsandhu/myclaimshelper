Overview
--------

     +-------------+       
     | UserProfile |
     +-------------+
           |                   
    +------+---------+      
    | BillingProfile |     
    +----------------+    
     


BillingProfile
--------------

Attributes
~~~~~~~~~~

API
~~~
Save a UserProfile
:: post, Dict -> status
'/userProfile'

Get a UserProfile. 
:: get, String id -> Dict
'/userProfile/:id'

