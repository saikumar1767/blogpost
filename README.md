# BLOG POST
Different APIs for a blog website.

## Technology stack:
 - MongoDB for database storage(mongoose odm).
 - Express.js and Node.js
 
## The Steps to Setup the project locally are as follows:

1.Firstly, install all the dependencies for backend with the command:
  ### `npm install`
2.Install MongoDB, and start the server on the port 27017.

3.Then, make sure the local port 9997 are available in your pc, then run the command for both as:
  ### `npm start`
Note: The End port 9997 is for hosting backend and clone down this repository. You will need `node` and `npm` installed globally on your machine.

## Different API Requests served are:
  - User Login and signup
  - Admin Login
  - GET All blog posts (only the titles and author)
  - GET details of the single blog post (title + author + content)   
  - Create a new blog post
  - Update an existing blog post
  - Delete an existing blog post
  - Get the filtered list of posts (filter by title)

(Back-End Database)
   - Here, MongoDB database is used to store the data and the database name used is 'blog post'.
   - In the database, two collections are created namely:
     - blogs,
     - users
   - In the blogs collection, the Schema designed which has:
      - title: String,
      - content: String,
      - author: String,
      - userId: mongoose.Schema.Types.ObjectId
   - In the users collection, the Schema designed which also has:
      - userName: String,
      - password: String,
      - isAdmin: Boolean
   - Admin should be able to delete any blog post, whereas normal users can delete only the blog posts created by them and isAdmin is set to true for admin and false for rest of users.
