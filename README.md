# Workout Logger

<<<<<<< HEAD
![Workout Logger Screenshot](/1.png)
=======
https://workoutlogger-s5dl.onrender.com/
(Render is a free service hosting and needs time to spin up if not used for awhile)
>>>>>>> 43f8b3a60091742ab26083de6d187e2f6087dd55

A comprehensive web application designed to track and manage individual workout sessions. Users can create workout plans, log workouts, view past sessions, and customize their workout experience with advanced features.

## 📱 Live Demo

This application is deployed on [Render](https://render.com/). Access the live application at [https://workoutlogger.onrender.com/](https://workoutlogger.onrender.com/).

## ✨ Features

- **Interactive Single-Page Application (SPA):** Offers a seamless user experience with dynamic content updates and no page reloads
- **Client-Side Input Validation:** Ensures robust data entry and user feedback without the need to refresh
- **Persistent Data Storage with MongoDB:** Secures workout data to be saved and retrievable anytime, anywhere
- **RESTful API Design:** Facilitates a scalable application infrastructure, enabling easy integration of future features
- **User Authentication and Authorization:** Provides secure access to user-specific workout plans and sessions with express-session middleware
- **Real-Time Workout Tracking:** Allows users to start, track, and save workout sessions with a built-in timer and exercise logger
- **Dynamic Workout Planning:** Users can create and modify workout plans, add workout days, and specify exercises for each day
- **Workout History:** View and analyze previous workout sessions to track progress over time

## 🛠️ Technologies Used

- **Frontend:** Vue.js 3, HTML5, CSS3
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** Express-session, bcrypt for password hashing
- **API:** RESTful API architecture
- **Deployment:** Render

## 📊 Data Models

### WorkoutPlan

- **Attributes:**
  - `userId`: String, required - The ID of the user who owns the workout plan
  - `splitName`: String, required - The name of the workout split
  - `workoutDays`: Array of Objects - Days included in the workout plan, each with their own exercises

### WorkoutSession

- **Attributes:**
  - `userId`: String, required - The ID of the user who logged the workout session
  - `date`: Date, required - The date of the workout session
  - `totalTime`: Number, required - The total time spent on the workout session
  - `workoutDayName`: String, required - The name of the workout day
  - `exercises`: Array of Objects - Exercises performed, including name, sets, reps, and weight

### User

- **Attributes:**
  - `firstName`: String, required - User's first name
  - `lastName`: String, required - User's last name
  - `email`: String, required, unique - User's email address
  - `password`: String, required - Encrypted password

## 🔄 API Endpoints

### User Management

- `POST /users` - Register a new user
- `POST /session` - Authenticate a user
- `GET /session` - Check authentication status
- `DELETE /session` - Log out a user

### Workout Plans

- `POST /workout-plan` - Create a new workout plan
- `GET /workout-plan` - Get all workout plans for the authenticated user
- `PUT /workout-plan/:planId` - Update a workout plan
- `PUT /workout-plan/:planId/clear` - Clear all workout days from a plan

### Workout Days

- `POST /workout-plan/day` - Add a day to the user's default workout plan
- `POST /workout-plan/:planId/day` - Add a day to a specific workout plan
- `PUT /workout-plan/:planId/day/:dayId` - Update a workout day
- `PUT /workout-plan/:planId/remove-day` - Remove a workout day from a plan

### Exercises

- `POST /workout-plan/:planId/day/:dayName/exercise` - Add an exercise to a workout day
- `PUT /workout-plan/:planId/day/:dayId/exercise/:exerciseId` - Update an exercise
- `DELETE /workout-plan/:planId/day/:dayName/exercise/:exerciseName` - Remove an exercise from a workout day

### Workout Sessions

- `POST /workout-sessions` - Log a new workout session
- `GET /workout-sessions` - Get all workout sessions for the authenticated user
- `DELETE /workout-sessions/:id` - Delete a specific workout session
- `DELETE /workout-sessions` - Delete all workout sessions for the authenticated user

## 🚀 Getting Started

<<<<<<< HEAD
### Prerequisites
=======
This application is deployed on [Render](https://render.com/). Access the live application at https://workoutlogger-s5dl.onrender.com/
>>>>>>> 43f8b3a60091742ab26083de6d187e2f6087dd55

- Node.js (v14 or higher)
- MongoDB account or local MongoDB installation
- npm or yarn package manager

### Local Development

<<<<<<< HEAD
1. Clone the repository:

   ```bash
   git clone https://github.com/kolin-nielson/WorkoutLogger.git
   cd WorkoutLogger
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables (if needed)

4. Start the development server:

   ```bash
   npm start
   ```

5. Open your browser and navigate to `http://localhost:8080`

### Using the Application

1. Register for a new account or log in with existing credentials
2. Set up your workout split by adding workout days (e.g., "Chest Day", "Leg Day")
3. Add exercises to each workout day
4. Start a workout session by selecting a workout day and clicking "Start Workout"
5. Log your sets, reps, and weights for each exercise
6. Finish your workout to save the session
7. View your workout history to track your progress

## 📷 Screenshots

![Workout Logger Interface](/public/images/image%20(4).png)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the ISC License.

## 👨‍💻 Author

- **Kolin Nielson** - [GitHub](https://github.com/kolin-nielson)
=======
1. Visit the live application link.
2. Register for a new account or log in.
3. Create and start tracking your workouts!
>>>>>>> 43f8b3a60091742ab26083de6d187e2f6087dd55
