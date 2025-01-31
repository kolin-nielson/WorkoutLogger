const bcrypt = require("bcrypt");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "First name is required"],
  },
  lastName: {
    type: String,
    required: [true, "Last name is required"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true, // database contraint; not a normal Mongoose validator
  },
  encryptedPassword: {
    type: String,
    required: [true, "Password is required"],
  },
  
});

//encrypt given plain password and store into database
userSchema.methods.setEncryptedPassword = function (plainPassword) {
  var promise = new Promise((resolve, reject) => {
    //experiment with 12 below
    bcrypt.hash(plainPassword, 12).then((hash) => {
      this.encryptedPassword = hash;
      resolve();
    });
  });

  return promise;
};
//verify an attempted password compared to stored encrypted password
userSchema.methods.verifyEncryptedPassword = function (plainPassword) {
  var promise = new Promise((resolve,reject) => {
      bcrypt.compare(plainPassword, this.encryptedPassword).then(result => {
        resolve(result);
      });
  });

  return promise;
};

module.exports = mongoose.model("User", userSchema);
