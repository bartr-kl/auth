# Paddle Stacks

## Org table
Create an orgs table that stores the organization information.
Primary Key should be a text or varchar field with 3 to 50 characters. The first character must be alpha (upper or lowercase), the remaining characters can be alphanumeric (upper or lowercase) or "-". The last character cannot be "-".
name and description fields
address fields (street, suite, city, state, zip)
us phone number field
web URL

sample data
Picklr
The Picklr - your home for pickleball
737-257-6035
8201 N FM 620
Austin, TX 78726
https://austinwest.thepicklr.com/

Pickle Ranch
The Pickle Ranch
11000 Middle Fiskville Road
Building B
Austin, TX 78753
https://www.austinpickleranch.com/
737-242-5898


## Locations table
create a locations table that stores the various locations.
Primary Key should be a text or varchar field with 3 to 50 characters. The first character must be alpha (upper or lowercase), the remaining characters can be alphanumeric (upper or lowercase) or "-". The last character cannot be "-".
the org_id is a foreign Key to the orgs table
name and description fields
address fields (street, suite, city, state, zip)
us phone number field
web url

sample data
Picklr Austin West
The Picklr - Austin West
737-257-6035
8201 N FM 620
Austin, TX 78726
https://austinwest.thepicklr.com/

Picklr Round Rock
The Picklr - Round Rock
737-734-2225
3021 I-35
Suite 240
Round Rock, TX 78664
https://roundrock.thepicklr.com/

Pickle Ranch
The Pickle Ranch
11000 Middle Fiskville Road
Building B
Austin, TX 78753
https://www.austinpickleranch.com/
737-242-5898

## Roles table
Create a roles table that stores the role(s) an authenticated user has for an org / location
Fields
user_id - FK to the profiles table
org_id - FK to the orgs table
location_id - FK to the locations table
role - enum (member, staff, admin)

sample data
bartr should have an admin and member role in all locations

## Create app
Create a next.js app that will be deployed on Vercel using supabase for auth and database storage.

The app should have /api/* routes that expose open API crud endpoints for the profiles table.

The app should have an admin dashboard that provides the same CRUD capabilities.
