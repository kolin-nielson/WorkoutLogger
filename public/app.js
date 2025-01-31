const app = Vue.createApp({
  data() {
    return {
      currentView: "login",
      loginUser: {
        email: "",
        password: "",
      },
      newUser: {
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
      },
      selectedDayId: "",
      newWorkoutDayName: "",
      newExerciseName: "",
      workoutInProgress: false,
      workoutTime: 0,
      workoutTimer: null,
      workoutPlan: { workoutDays: [] },
      selectedDayIdForExercise: "",
      isWorkoutPlanLoaded: false,
      currentWorkoutSession: null,
      workoutSessions: [],
      workoutDays: [],
      message: { content: "", type: "" },
      validationErrors: [],
      dynamicValidationErrors: {},
      startTime: null,
      timerTrigger: false,
      isEditing: false,
      tempEditName: "",
      currentItemBeingEdited: null,
      componentKey: 0,
    };
  },
  computed: {
    selectedWorkoutDayName() {
      const day = this.workoutPlan.workoutDays.find(
        (day) => day._id === this.selectedDayIdForExercise
      );
      return day ? day.dayName : "";
    },
    selectedWorkoutDayExercises() {
      const day = this.workoutPlan.workoutDays.find(
        (day) => day._id === this.selectedDayId
      );
      return day ? day.exercises : [];
    },
    formattedWorkoutTime() {
      console.log(this.timerTrigger);

      if (!this.startTime) return "00:00:00";

      const elapsedTime = Date.now() - this.startTime;
      const hours = Math.floor(elapsedTime / 3600000);
      const minutes = Math.floor((elapsedTime % 3600000) / 60000);
      const seconds = Math.floor((elapsedTime % 60000) / 1000);

      const pad = (num) => num.toString().padStart(2, "0");
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    },
    selectedDayExercises() {
      const day = this.workoutPlan.workoutDays.find(
        (day) => day._id === this.selectedDayIdForExercise
      );
      return day ? day.exercises : [];
    },
  },
  created() {
    this.checkSession();
    this.loadWorkoutPlan();
    this.fetchWorkoutSessions();
  },
  methods: {
    switchView(view) {
      this.currentView = view;
      this.clearMessage();
    },

    async checkSession() {
      try {
        const response = await fetch("/session", { credentials: "include" });
        const data = await response.json();
        if (data.status === "Authenticated") {
          this.switchView("home");
          await this.loadWorkoutPlan();
        } else {
          this.switchView("login");
        }
      } catch (error) {
        console.error("Session check failed:", error);
        this.switchView("login");
      }
    },
    validateEmail() {
      this.validationErrors = this.validationErrors.filter(
        (error) => !error.includes("Email")
      );

      if (!this.newUser.email.includes("@")) {
        this.validationErrors.push("Email must contain '@'.");
      }
    },

    validatePassword() {
      // Clear previous errors related to password validation
      this.validationErrors = this.validationErrors.filter(
        (error) => !error.includes("Password")
      );

      // Password length check
      if (this.newUser.password.length < 8) {
        this.validationErrors.push(
          "Password must be at least 8 characters long."
        );
      }

      // Password confirmation check
      if (this.newUser.password !== this.newUser.confirmPassword) {
        this.validationErrors.push("Passwords do not match.");
      }
    },

    cancelWorkout() {
      clearInterval(this.workoutTimer);
      this.workoutTimer = null;
      this.workoutInProgress = false;
      this.startTime = null;
      this.workoutTime = 0;
      this.currentWorkoutSession = null;
      this.selectedDayId = "";
      this.showMessage("Workout cancelled.", "info");
    },

    startEdit(itemType, item, exercise = null) {
      console.log("Starting to edit: ", itemType, item, exercise);
      this.isEditing = true;
      if (itemType === "exercise") {
        this.currentItemBeingEdited = {
          dayId: item._id,
          exerciseId: exercise._id,
          name: exercise.name,
        };
        this.tempEditName = exercise.name;
      } else {
        this.currentItemBeingEdited = item;
        this.tempEditName = item.dayName || "";
      }
      this.currentEditType = itemType;
    },

    cancelEdit() {
      console.log("Edit cancelled");
      this.isEditing = false;
      this.tempEditName = "";
      this.currentItemBeingEdited = null;
      this.currentEditType = null;
    },

    async updateEdit() {
      if (!this.currentEditType || !this.currentItemBeingEdited) {
        console.error("Edit type or item being edited is undefined");
        return;
      }
      console.log(
        "Updating: ",
        this.currentEditType,
        this.currentItemBeingEdited
      );
      if (this.currentEditType === "workoutDay") {
        this.updateWorkoutDay(this.currentItemBeingEdited._id, {
          dayName: this.tempEditName,
        });
      } else if (this.currentEditType === "exercise") {
        this.updateExercise(
          this.currentItemBeingEdited.dayId,
          this.currentItemBeingEdited.exerciseId,
          this.tempEditName
        );
      }
      this.cancelEdit();
    },

    login() {
      const payload = {
        email: this.loginUser.email,
        password: this.loginUser.password,
      };

      fetch("/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to log in");
          }
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
            return response.json(); // Parse it as JSON if it's JSON
          } else {
            return response.text(); // Otherwise, treat it as plain text
          }
        })
        .then((data) => {
          console.log("Login successful:", data);
          this.showMessage("Login successful.", "success");
          this.switchView("home");
          this.loadUserData(); // Load user-specific data
        })
        .catch((error) => {
          console.error("Login failed:", error);
          this.showMessage("Login failed. Please try again.", "error");
        });
    },
    async loadUserData() {
      await this.loadWorkoutPlan();
      this.fetchWorkoutSessions();
    },

    register() {
      console.log("register called");
      const payload = {
        firstName: this.newUser.firstName,
        lastName: this.newUser.lastName,
        email: this.newUser.email,
        plainPassword: this.newUser.password,
      };

      fetch("/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      })
        .then((response) =>
          response
            .json()
            .then((data) => ({ status: response.status, body: data }))
        )
        .then(({ status, body }) => {
          if (status === 201) {
            // Registration successful
            console.log("Registration successful:", body);
            this.showMessage("Registration successful.", "success");
            this.switchView("login"); // Redirect the user to the login page
            // Clear registration form
            this.newUser.firstName = "";
            this.newUser.lastName = "";
            this.newUser.email = "";
            this.newUser.password = "";
            this.newUser.confirmPassword = "";
          } else if (status === 409) {
            // Email already in use
            this.validationErrors.push(body.message);
          } else {
            // Other errors
            this.showMessage("Registration failed. Please try again.", "error");
          }
        })
        .catch((error) => {
          console.error("Registration failed:", error);
          this.showMessage("Registration failed. Please try again.", "error");
        });
    },

    logout() {
      fetch("/session", {
        method: "DELETE",
        credentials: "include",
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Logout failed");
          }
          this.switchView("login");
          this.showMessage("You have been logged out.", "info");

          this.resetAppState();
        })
        .catch((error) => {
          console.error("Logout error:", error);
          this.showMessage(
            "An error occurred during logout. Please try again.",
            "error"
          );
        });
    },
    resetAppState() {
      this.loginUser.email = "";
      this.loginUser.password = "";

      this.workoutPlan = { workoutDays: [] };
      this.currentWorkoutSession = null;
      this.workoutSessions = [];

      this.clearMessage();
    },

    clearMessage() {
      this.message = { content: "", type: "" };
    },
    showMessage(content, type = "info", timeout = 5000) {
      this.message = { content, type };
      setTimeout(() => {
        this.clearMessage();
      }, timeout);
    },
    clearAllWorkoutSessions() {
      if (
        confirm(
          "Are you sure you want to delete all previous workout sessions? This action cannot be undone."
        )
      ) {
        fetch("/workout-sessions", {
          method: "DELETE",
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Failed to delete workout sessions");
            }
            return response.text();
          })
          .then(() => {
            this.showMessage("All workout sessions have been deleted.", "info");
            this.fetchWorkoutSessions();
          })
          .catch((error) => {
            console.error("Error:", error);
            this.showMessage("Failed to delete workout sessions", "error");
          });
      }
    },

    validateAndSubmitWorkout() {
      this.validationErrors = [];
      let hasError = false;

      this.currentWorkoutSession.exercises.forEach((exercise) => {
        if (exercise.sets < 1) {
          this.validationErrors.push(
            `Sets must be at least 1 for ${exercise.name}.`
          );
          hasError = true;
        }
        if (exercise.reps < 1) {
          this.validationErrors.push(
            `Reps must be at least 1 for ${exercise.name}.`
          );
          hasError = true;
        }
        if (exercise.weight < 0) {
          this.validationErrors.push(
            `Weight must be at least 0 for ${exercise.name}.`
          );
          hasError = true;
        }
      });

      if (!hasError) {
        this.finishWorkout();
      }
    },
    validateExercise(exerciseIndex) {
      const exercise = this.currentWorkoutSession.exercises[exerciseIndex];
      this.dynamicValidationErrors[exerciseIndex] = [];

      if (exercise.sets < 1) {
        this.dynamicValidationErrors[exerciseIndex].push(
          `Sets must be at least 1.`
        );
      }

      if (exercise.reps < 1) {
        this.dynamicValidationErrors[exerciseIndex].push(
          `Reps must be at least 1.`
        );
      }

      if (exercise.weight < 0) {
        this.dynamicValidationErrors[exerciseIndex].push(
          `Weight must be non-negative.`
        );
      }
    },

    async submitWorkoutSession() {
      const selectedWorkoutDay = this.workoutPlan.workoutDays.find(
        (day) => day._id === this.selectedDayId
      );
      const workoutDayName = selectedWorkoutDay
        ? selectedWorkoutDay.dayName
        : "";

      // Convert formatted workout time to total seconds
      const totalTime = this.currentWorkoutSession.totalTime;

      const payload = {
        date: new Date().toISOString(),
        exercises: this.currentWorkoutSession.exercises.map((exercise) => ({
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: exercise.weight,
        })),
        totalTime: totalTime,
        workoutDayName: workoutDayName,
      };

      try {
        const response = await fetch("/workout-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to save workout session: ${errorText}`);
        }

        const data = await response.json();
        console.log("Workout session saved successfully:", data);
        this.showMessage("Workout session saved successfully.", "info");
        this.currentWorkoutSession = null; // Reset the current workout session state
        this.fetchWorkoutSessions(); // Reload the user's workout sessions to reflect the newly added one
      } catch (error) {
        console.error("Error saving workout session:", error);
        this.showMessage(
          `Failed to save workout session: ${error.message}`,
          "error"
        );
      }
    },

    prepareWorkoutDays() {
      const uniqueDayNames = new Set(
        this.workoutSessions.map((session) => session.workoutDayName)
      );
      this.workoutDays = Array.from(uniqueDayNames).map((dayName) => ({
        name: dayName,
        isCollapsed: false,
      }));
    },
    getLastThreeSessions(dayName) {
      return this.workoutSessions
        .filter((session) => session.workoutDayName === dayName)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);
    },
    toggleCollapse(dayName) {
      const dayIndex = this.workoutDays.findIndex((d) => d.name === dayName);
      if (dayIndex !== -1) {
        const day = { ...this.workoutDays[dayIndex] };
        day.isCollapsed = !day.isCollapsed;
        this.workoutDays.splice(dayIndex, 1, day);
      }
    },
    filteredSessions(dayName) {
      return this.workoutSessions.filter(
        (session) => session.workoutDayName === dayName
      );
    },
    fetchWorkoutSessions() {
      return fetch("/workout-sessions")
        .then((response) => response.json())
        .then((data) => {
          this.workoutSessions = data;
          this.prepareWorkoutDays();
        })
        .catch((error) =>
          console.error("Failed to load workout sessions:", error)
        );
    },
    async addWorkoutDay() {
      // Check if the workout plan is loaded and has an ID. If not, try to load it.
      if (!this.isWorkoutPlanLoaded || !this.workoutPlan._id) {
        await this.loadWorkoutPlan();
      }

      // Double check if workoutPlan is loaded and has an ID after attempting to load it.
      if (!this.workoutPlan._id) {
        console.error(
          "No workout plan available. Please create a workout plan first."
        );
        this.showMessage(
          "No workout plan available. Please create a workout plan first.",
          "error"
        );
        return;
      }

      const newDay = {
        dayName: this.newWorkoutDayName,
        exercises: [],
      };

      try {
        const response = await fetch(
          `/workout-plan/${this.workoutPlan._id}/day`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(newDay),
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to add workout day: ${await response.text()}`
          );
        }

        const updatedPlan = await response.json();
        this.workoutPlan = updatedPlan;
        this.newWorkoutDayName = ""; // Clear the input field after successful addition
        this.showMessage("Workout day added successfully.", "info");
      } catch (error) {
        console.error("Error adding workout day:", error);
        this.showMessage(`Error adding workout day: ${error.message}`, "error");
      }
    },

    saveNewWorkoutDay() {
      const newDay = {
        dayName: this.newWorkoutDayName,
        exercises: [], // Starts with an empty exercises array
      };
      fetch(`/workout-plan/day`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDay),
        credentials: "include",
      })
        .then((response) => response.json())
        .then((data) => {
          this.showMessage("Workout day added successfully.", "info");
          this.loadWorkoutPlan(); // Reload or update the workout plan data
        })
        .catch((error) => {
          this.showMessage(
            "Failed to add workout day: " + error.message,
            "error"
          );
        });
    },

    async addExercise() {
      if (this.newExerciseName && this.selectedDayIdForExercise) {
        const selectedDay = this.workoutPlan.workoutDays.find(
          (day) => day._id === this.selectedDayIdForExercise
        );

        if (!selectedDay) {
          this.showMessage(
            "Day not found. Please select a valid day.",
            "error"
          );
          return;
        }

        try {
          const response = await fetch(
            `/workout-plan/${this.workoutPlan._id}/day/${encodeURIComponent(
              selectedDay.dayName
            )}/exercise`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ exercise: this.newExerciseName }),
            }
          );

          if (!response.ok) throw new Error("Failed to add exercise");
          await response.json();
          this.showMessage("Exercise added successfully.", "info");
          this.newExerciseName = ""; // Reset input
          this.loadWorkoutPlan(); // Refresh workout plan details
        } catch (error) {
          console.error("Error adding exercise:", error);
          this.showMessage(`Failed to add exercise: ${error.message}`, "error");
        }
      } else {
        this.showMessage(
          "Please select a day and enter an exercise name.",
          "error"
        );
      }
    },

    removeExercise(dayName, exerciseName) {
      const url = `/workout-plan/${
        this.workoutPlan._id
      }/day/${encodeURIComponent(dayName)}/exercise/${encodeURIComponent(
        exerciseName
      )}`;
      fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      })
        .then((response) => {
          if (!response.ok) throw new Error("Network response was not ok.");
          this.loadWorkoutPlan();
        })
        .catch((error) => console.error("Failed to remove exercise:", error));
    },
    async removeWorkoutDay(dayName) {
      if (!dayName) {
        console.error("No dayName provided for removal.");
        return;
      }

      try {
        const response = await fetch(
          `/workout-plan/${this.workoutPlan._id}/remove-day`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dayName: dayName }),
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to remove workout day.");
        }

        const updatedPlan = await response.json();
        this.workoutPlan = updatedPlan;
        this.showMessage("Workout day removed successfully.", "info");
      } catch (error) {
        console.error("Failed to remove workout day:", error);
        this.showMessage(
          `Failed to remove workout day: ${error.message}`,
          "error"
        );
      }
    },

    async updateWorkoutDay(dayId, updatedDay) {
      try {
        const response = await fetch(
          `/workout-plan/${this.workoutPlan._id}/day/${dayId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(updatedDay),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to update workout day: ${errorText}`);
        }

        const data = await response.json();
        console.log("Workout day updated successfully:", data);
        this.showMessage("Workout day updated successfully.", "info");
      } catch (error) {
        console.error("Error updating workout day:", error);
        this.showMessage(
          `Error updating workout day: ${error.message}`,
          "error"
        );
      }
    },

    async updateExercise(dayId, exerciseId, newName) {
      const url = `/workout-plan/${this.workoutPlan._id}/day/${dayId}/exercise/${exerciseId}`;
      try {
        const response = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name: newName }),
        });
        if (!response.ok) throw new Error("Failed to update exercise.");
        await this.loadWorkoutPlan();
        this.showMessage("Exercise updated successfully.", "info");
      } catch (error) {
        console.error("Failed to update exercise:", error);
        this.showMessage(
          `Failed to update exercise: ${error.message}`,
          "error"
        );
      }
    },

    clearWorkoutDays() {
      if (!confirm("Are you sure you want to clear all workout days?")) {
        return;
      }
      fetch(`/workout-plan/${this.workoutPlan._id}/clear`, {
        method: "PUT",
      })
        .then((response) => response.json())
        .then(() => {
          this.workoutPlan.workoutDays = [];
          console.log("All workout days cleared successfully.");
        })
        .catch((error) =>
          console.error("Failed to clear workout days:", error)
        );
    },
    startWorkout() {
      this.workoutInProgress = true;
      this.startTime = Date.now();
      this.workoutTime = 0;
      this.workoutTimer = setInterval(() => {
        this.timerTrigger = !this.timerTrigger;
      }, 1000);
      const selectedDay = this.workoutPlan.workoutDays.find(
        (day) => day._id === this.selectedDayId
      );
      if (selectedDay) {
        this.currentWorkoutSession = {
          date: new Date().toISOString(),
          exercises: selectedDay.exercises.map((exerciseName) => ({
            name: exerciseName,
            weight: "",
            sets: "",
            reps: "",
          })),
          totalTime: 0,
        };
      }
    },
    finishWorkout() {
      clearInterval(this.workoutTimer);
      this.workoutTimer = null;

      const endTime = Date.now();
      const totalTimeElapsed = endTime - this.startTime;

      const totalTimeInSeconds = Math.floor(totalTimeElapsed / 1000);

      this.currentWorkoutSession.totalTime = totalTimeInSeconds;

      this.currentWorkoutSession.exercises.forEach((_, index) =>
        this.validateExercise(index)
      );

      this.startTime = null;
      this.workoutInProgress = false;

      const hasErrors = Object.values(this.dynamicValidationErrors).some(
        (errors) => errors.length > 0
      );
      if (hasErrors) {
        this.showMessage(
          "Please correct the errors before finishing the workout.",
          "error"
        );
        return;
      }
      this.submitWorkoutSession();
    },

    async loadWorkoutPlan() {
      try {
        const response = await fetch("/workout-plan", {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to load workout plan");
        const plans = await response.json();
        if (plans.length > 0) {
          this.workoutPlan = plans[0];
          this.isWorkoutPlanLoaded = true;
        } else {
          console.log("No workout plan found, consider creating one.");
        }
      } catch (error) {
        console.error("Error loading workout plan:", error);
      }
    },

    async createWorkoutPlan() {
      try {
        const response = await fetch("/workout-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ splitName: "Default Plan" }),
        });
        if (!response.ok)
          throw new Error(
            `Failed to create workout plan: ${response.statusText}`
          );
        const newPlan = await response.json();
        this.workoutPlan = newPlan;
        this.isWorkoutPlanLoaded = true;
        console.log("Workout plan created successfully.");
      } catch (error) {
        console.error("Error creating new workout plan:", error);
      }
    },

    saveWorkoutPlan() {
      const url =
        "/workout-plan" +
        (this.workoutPlan._id ? `/${this.workoutPlan._id}` : "");
      const method = this.workoutPlan._id ? "PUT" : "POST";
      fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.workoutPlan),
      })
        .then((response) => response.json())
        .then((data) => {
          if (!this.workoutPlan._id && data._id) {
            this.workoutPlan._id = data._id;
          }
          console.log("Workout plan saved successfully.");
        })
        .catch((error) => console.error("Failed to save workout plan:", error));
    },
    saveWorkoutSession() {
      const totalTime = this.workoutTime;
      const workoutDayName = this.workoutPlan.workoutDays.find(
        (day) => day._id === this.selectedDayId
      )?.dayName;
      const exercises = this.currentWorkoutSession.exercises.map(
        (exercise) => ({
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: exercise.weight,
        })
      );
      const workoutSession = {
        totalTime,
        workoutDayName,
        exercises,
      };
      fetch("/workout-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workoutSession),
      })
        .then((response) => response.json())
        .then((data) => {
          this.currentWorkoutSession = null;
          this.fetchWorkoutSessions();
        })
        .catch((error) =>
          console.error("Error saving workout session:", error)
        );
    },
  },
  filters: {
    formatDate(value) {
      return value ? new Date(value).toLocaleDateString() : "";
    },
  },
}).mount("#app");
