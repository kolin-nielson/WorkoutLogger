# Workout Logger

A comprehensive web application designed to track and manage individual workout sessions. Users can create workout plans, log workouts, view past sessions, and customize their workout experience with advanced features.

## Features

- **Interactive Single-Page Application (SPA):** Offers a seamless user experience with dynamic content updates and no page reloads.
- **Client-Side Input Validation:** Ensures robust data entry and user feedback without the need to refresh.
- **Persistent Data Storage with MongoDB:** Secures workout data to be saved and retrievable anytime, anywhere.
- **RESTful API Design:** Facilitates a scalable application infrastructure, enabling easy integration of future features.
- **User Authentication and Authorization:** Provides secure access to user-specific workout plans and sessions with express-session middleware.
- **Real-Time Workout Tracking:** Allows users to start, track, and save workout sessions with a built-in timer and exercise logger.
- **Dynamic Workout Planning:** Users can create and modify workout plans, add workout days, and specify exercises for each day.

## Data Models

### WorkoutPlan

- **Attributes:**
  - `userId`: String, required - The ID of the user who owns the workout plan.
  - `splitName`: String, required - The name of the workout split.
  - `workoutDays`: Array of Objects - Days included in the workout plan, each with their own exercises.

### WorkoutSession

- **Attributes:**
  - `userId`: String, required - The ID of the user who logged the workout session.
  - `date`: Date, required - The date of the workout session.
  - `totalTime`: Number, required - The total time spent on the workout session.
  - `workoutDayName`: String, required - The name of the workout day.
  - `exercises`: Array of Objects - Exercises performed, including name, sets, reps, and weight.

## API Endpoints

### User Management

- `POST /users` - Register a new user.
- `POST /session` - Authenticate a user.
- `DELETE /session` - Log out a user.

### Workout Plans

- Various endpoints for managing workout plans, including creation, updating, and deletion.

### Workout Days

- Endpoints for adding, updating, and removing workout days within plans.

### Workout Sessions

- Endpoints for logging, retrieving, and deleting workout sessions.

## Deployment

This application is deployed on [Render](https://render.com/). Access the live application at [https://workoutlogger.onrender.com/](https://workoutlogger.onrender.com/).

## Getting Started

To get started with the Workout Logger:

1. Visit the live application link.
2. Register for a new account or log in.
3. Start tracking your workouts and progress!
