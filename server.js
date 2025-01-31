const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(express.static("public"));
app.use(
  cors({
    credentials: true,
    origin: function (origin, callback) {
      callback(null, origin); //avoid using the wildcard origin
    },
  })
);
app.use(express.json());
app.use(
  session({
    secret: "12q3w4edrftyguhjn098uyuutfdsertyuhujn123erfghbvcxzsawertyujm",
    saveUninitialized: true,
    resave: false,
    cookies: {
      secure: true, //fixes chrome, breaks Postman
      sameSite: "None",
    },
  })
);
const port = process.env.PORT || 8080;

mongoose
  .connect(
    "mongodb+srv://SE4200:IM9F4uS8ospLgFNa@se4200-cluster.kpkn2hu.mongodb.net/",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const WorkoutPlan = require("./models/workoutplan");
const WorkoutSession = require("./models/workoutsession");
const User = require("./models/user");

//my middlewares
function authorizedRequest(req, res, next) {
  if (req.session && req.session.userID) {
    User.findById(req.session.userID)
      .then((user) => {
        if (!user) {
          return res.status(401).send("Not Authorized");
        }
        req.user = user;
        next();
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).send("Internal Server Error");
      });
  } else {
    res.status(401).send("Not Authorized");
  }
}

// Registration endpoint with unique email check
app.post("/users", async function (req, res) {
  const { firstName, lastName, email, plainPassword } = req.body;

  // Check if email is already in use
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ message: "Email already in use" });
  }

  // Continue with registration if email is not in use
  const newUser = new User({ firstName, lastName, email });

  try {
    await newUser.setEncryptedPassword(plainPassword);
    const savedUser = await newUser.save();

    // Automatically create a default workout plan for the new user
    const newWorkoutPlan = new WorkoutPlan({
      userId: savedUser._id,
      splitName: savedUser._id.toString() + "_Plan",
      workoutDays: [],
    });
    await newWorkoutPlan.save();

    res
      .status(201)
      .json({ message: "User created and workout plan initialized" });
  } catch (error) {
    console.error("Error during user registration:", error);
    res.status(500).json({ message: "Unknown error during user registration" });
  }
});

// Authentication: create session
app.post("/session", function (req, res) {
  console.log(req.body);

  User.findOne({ email: req.body.email })
    .then(function (user) {
      if (user) {
        user.verifyEncryptedPassword(req.body.password).then(function (match) {
          if (match) {
            const userObj = user.toObject();

            delete userObj.password;
            delete userObj.__v; // Version key used internally by Mongoose

            req.session.userID = user._id.toString();

            res.status(201).json({
              message: "Authenticated",
              user: {
                id: userObj._id,
                email: userObj.email,
              },
            });
          } else {
            res.status(401).send("Not Authenticated");
          }
        });
      } else {
        res.status(401).send("Not Authenticated");
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send("Internal Server Error");
    });
});

// Retrieve session
app.get("/session", function (req, res) {
  console.log("session:", req.session);

  if (req.session.userID) {
    User.findById(req.session.userID)
      .then((user) => {
        if (!user) {
          return res.status(401).json({ status: "Unauthenticated" });
        }
        const userData = {
          id: user._id,
          email: user.email,
        };
        res.json({ status: "Authenticated", user: userData });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Internal Server Error");
      });
  } else {
    res.status(401).json({ status: "Unauthenticated" });
  }
});

//delete session
app.delete("/session", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).send("Internal Server Error");
    } else {
      res.send("Logged out successfully");
    }
  });
});

// Create a workout plan for a specific user
app.post("/workout-plan", authorizedRequest, async (req, res) => {
  // Create a new workout plan with user ID from the session
  const workoutPlan = new WorkoutPlan({
    ...req.body,
    userId: req.user._id,
  });

  try {
    const savedWorkoutPlan = await workoutPlan.save();
    res.status(201).json(savedWorkoutPlan);
  } catch (err) {
    console.error("Error saving workout plan:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Add a day to a user's workout plan
app.post("/workout-plan/day", authorizedRequest, async function (req, res) {
  let workoutPlan = await WorkoutPlan.findOne({ userId: req.user._id });

  if (!workoutPlan) {
    workoutPlan = new WorkoutPlan({
      userId: req.user._id,
      splitName: "Default Plan",
      workoutDays: [],
    });

    try {
      await workoutPlan.save();
    } catch (error) {
      return res
        .status(500)
        .send("Internal Server Error during workout plan creation");
    }
  }

  workoutPlan.workoutDays.push(req.body);
  try {
    await workoutPlan.save();
    res.status(201).json(workoutPlan);
  } catch (error) {
    res.status(500).send("Internal Server Error during day addition");
  }
});

// Add a day to a user's workout plan
app.post("/workout-plan/:planId/day", authorizedRequest, async (req, res) => {
  const { planId } = req.params;
  const workoutPlan = await WorkoutPlan.findById(planId);

  if (!workoutPlan) {
    return res.status(404).send("Workout plan not found.");
  }

  workoutPlan.workoutDays.push(req.body);
  try {
    await workoutPlan.save();
    res.status(201).json(workoutPlan);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

// Add an exercise to a day in a user's workout plan
app.post(
  "/workout-plan/:planId/day/:dayName/exercise",
  authorizedRequest,
  async (req, res) => {
    try {
      const workoutPlan = await WorkoutPlan.findOne({
        _id: req.params.planId,
        userId: req.user._id,
      });

      if (!workoutPlan) {
        return res
          .status(404)
          .send("Workout plan not found or not authorized.");
      }

      const day = workoutPlan.workoutDays.find(
        (day) => day.dayName === req.params.dayName
      );
      if (!day) {
        return res.status(404).send("Day not found.");
      }

      day.exercises.push(req.body.exercise);
      await workoutPlan.save();
      res.status(201).json(workoutPlan);
    } catch (err) {
      console.error("Error updating workout plan:", err);
      res.status(500).send("Internal Server Error");
    }
  }
);

// Get all workout plans for a specific user
app.get("/workout-plan", authorizedRequest, async (req, res) => {
  try {
    const userId = req.user._id;
    const workoutPlans = await WorkoutPlan.find({ userId: userId });
    res.json(workoutPlans);
  } catch (error) {
    console.error("Failed to get workout plans:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/workout-sessions", authorizedRequest, async (req, res) => {
  const workoutSession = new WorkoutSession({
    ...req.body,
    userId: req.user._id,
  });

  try {
    const savedSession = await workoutSession.save();
    res.status(201).json(savedSession);
  } catch (err) {
    console.error("Error saving workout session:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Get all workout sessions for a specific user
app.get("/workout-sessions", authorizedRequest, async (req, res) => {
  try {
    const sessions = await WorkoutSession.find({ userId: req.user._id });
    res.json(sessions);
  } catch (err) {
    console.error("Error fetching workout sessions:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Update a workout plan
app.put("/workout-plan/:planId", authorizedRequest, async (req, res) => {
  const planId = req.params.planId;
  const userId = req.user._id;

  console.log(`Updating plan ${planId} for user ${userId}`);

  try {
    const plan = await WorkoutPlan.findOne({ _id: planId, userId: userId });
    if (!plan) {
      console.log(
        `Plan not found or unauthorized. Plan ID: ${planId}, User ID: ${userId}`
      );
      return res.status(404).send("Workout plan not found or not authorized.");
    }

    res.json(plan);
  } catch (error) {
    console.error(`Error updating workout plan: ${error}`);
    res.status(500).send("Internal Server Error");
  }
});

// Update an exercise name within a day
app.put(
  "/workout-plan/:planId/day/:dayId/exercise/:exerciseId",
  authorizedRequest,
  async (req, res) => {
    const { newName } = req.body;
    try {
      const plan = await WorkoutPlan.findById(req.params.planId);
      const day = plan.workoutDays.id(req.params.dayId);
      const exercise = day.exercises.id(req.params.exerciseId); // This line may need adjustment
      if (!exercise) {
        return res.status(404).send("Exercise not found.");
      }
      exercise.name = newName; // Adjust based on your model
      await plan.save();
      res.json(plan);
    } catch (error) {
      console.error("Error updating exercise:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

// Update a workout day name
app.put(
  "/workout-plan/:planId/day/:dayId",
  authorizedRequest,
  async (req, res) => {
    const { newName } = req.body;
    try {
      const plan = await WorkoutPlan.findById(req.params.planId);
      const day = plan.workoutDays.id(req.params.dayId);
      if (!day) {
        return res.status(404).send("Workout day not found.");
      }
      day.dayName = newName;
      await plan.save();
      res.json(plan);
    } catch (error) {
      console.error("Error updating workout day:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

// Update a workout day name and/or exercises
app.put(
  "/workout-plan/:planId/day/:dayId",
  authorizedRequest,
  async (req, res) => {
    const { dayId, planId } = req.params;
    const { newName, exercises } = req.body;

    try {
      const plan = await WorkoutPlan.findOne({
        _id: planId,
        userId: req.user._id,
      });
      if (!plan) {
        return res
          .status(404)
          .send("Workout plan not found or not authorized.");
      }

      const day = plan.workoutDays.id(dayId);
      if (!day) {
        return res.status(404).send("Workout day not found.");
      }

      // Update the day
      if (newName) day.dayName = newName;
      if (exercises) day.exercises = exercises;
      await plan.save();

      res.json(plan);
    } catch (error) {
      console.error(`Error updating workout day: ${error}`);
      res.status(500).send("Internal Server Error");
    }
  }
);

// Update a day in a workout plan
// app.put(
//   "/workout-plan/:planId/day/:dayName",
//   authorizedRequest,
//   function (req, res) {
//     WorkoutPlan.findOne(
//       { _id: req.params.planId, userId: req.user._id },
//       function (err, workoutPlan) {
//         if (err || !workoutPlan) {
//           return res
//             .status(404)
//             .send("Workout plan not found or not authorized.");
//         }

//         const dayIndex = workoutPlan.workoutDays.findIndex(
//           (day) => day.dayName === req.params.dayName
//         );
//         if (dayIndex === -1) {
//           return res.status(404).send("Day not found.");
//         }

//         workoutPlan.workoutDays[dayIndex] = {
//           ...workoutPlan.workoutDays[dayIndex].toObject(),
//           ...req.body,
//         };
//         workoutPlan.save(function (err, updatedWorkoutPlan) {
//           if (err) {
//             console.error("Error updating workout plan:", err);
//             return res.status(500).send("Internal Server Error");
//           }
//           res.json(updatedWorkoutPlan);
//         });
//       }
//     );
//   }
// );

// Update a workout plan to remove a specific workout day
app.put(
  "/workout-plan/:planId/remove-day",
  authorizedRequest,
  async (req, res) => {
    try {
      const { planId } = req.params;
      const { dayName } = req.body;

      const workoutPlan = await WorkoutPlan.findOne({
        _id: planId,
        userId: req.user._id,
      });
      if (!workoutPlan) {
        return res
          .status(404)
          .send("Workout plan not found or not authorized.");
      }

      // Remove the day by filtering out the day with the given dayName
      workoutPlan.workoutDays = workoutPlan.workoutDays.filter(
        (day) => day.dayName !== dayName
      );

      await workoutPlan.save();
      res.json(workoutPlan);
    } catch (err) {
      console.error("Error updating workout plan:", err);
      res.status(500).send("Internal Server Error");
    }
  }
);

// Remove an exercise from a day in a workout plan
app.delete(
  "/workout-plan/:planId/day/:dayName/exercise/:exerciseName",
  authorizedRequest,
  async function (req, res) {
    try {
      const workoutPlan = await WorkoutPlan.findOne({
        _id: req.params.planId,
        userId: req.user._id,
      });

      if (!workoutPlan) {
        return res
          .status(404)
          .send("Workout plan not found or not authorized.");
      }

      const day = workoutPlan.workoutDays.find(
        (day) => day.dayName === req.params.dayName
      );

      if (!day) {
        return res.status(404).send("Day not found.");
      }

      day.exercises = day.exercises.filter(
        (exercise) => exercise !== req.params.exerciseName
      );

      const updatedWorkoutPlan = await workoutPlan.save();
      res.send(`Exercise '${req.params.exerciseName}' removed successfully.`);
    } catch (err) {
      console.error("Error updating workout plan:", err);
      res.status(500).send("Internal Server Error");
    }
  }
);

// Clear all workout days from a plan
app.put("/workout-plan/:planId/clear", authorizedRequest, async (req, res) => {
  try {
    const { planId } = req.params;
    const updatedWorkoutPlan = await WorkoutPlan.findOneAndUpdate(
      { _id: planId, userId: req.user._id },
      { $set: { workoutDays: [] } },
      { new: true } // Returns the modified document
    );

    if (!updatedWorkoutPlan) {
      return res.status(404).send("Workout plan not found or not authorized.");
    }
    res.json(updatedWorkoutPlan);
  } catch (err) {
    console.error("Error clearing workout days:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Delete a workout session
app.delete("/workout-sessions/:id", authorizedRequest, function (req, res) {
  WorkoutSession.findOneAndRemove(
    { _id: req.params.id, userId: req.user._id },
    function (err, deletedSession) {
      if (err || !deletedSession) {
        console.error("Error deleting workout session or not authorized:", err);
        return res
          .status(404)
          .send("Workout session not found or not authorized.");
      }
      res.status(204).send();
    }
  );
});

// Delete all workout sessions for a user
app.delete("/workout-sessions", authorizedRequest, async (req, res) => {
  try {
    await WorkoutSession.deleteMany({ userId: req.user._id });
    res.send("All workout sessions have been deleted.");
  } catch (error) {
    console.error("Error deleting workout sessions:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
