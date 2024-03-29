const Joi = require("joi");
const {STATUS_CODES} = require("http");

// const normalisePhoneNumber = require("../../utils/normalisePhoneNumber");
const {userRecordExists, createUser} = require("../../services/userService");
const {numberRecordExists} = require("../../services/numberService");

const signupPayloadSchema = Joi.object().keys({
  name: Joi.string()
    .trim()
    .required()
    .max(50)
    .regex(/^[^!@#$%^&*(){}\[\]\\\.;'",.<>/?`~|0-9]*$/)
    .message("Name should not contain any special character or number"),

  number: Joi.string()
    .trim()
    .required()
    .length(10)
    .message("Number is invalid"),

  password: Joi.string().trim().required(),

  confirmPassword: Joi.any()
    .required()
    .equal(Joi.ref("password"))
    .messages({ "any.only": "confirmPassword should equal password" }),

  email: Joi.string().email(),
});

async function signup(req, res, next){
  try {
    const payload = req.body;
    const {error, value} = signupPayloadSchema.validate(payload);
    if (!!error){
      return res
        .status(422)
        .json({
          statusCode: 422,
          error: STATUS_CODES[422],
          message: error.message
        });
    }
    
    const {number} = value;
    // number = normalisePhoneNumber(number);
    
    const userDoc = await userRecordExists(number);
    if (userDoc){
      return res
        .status(400)
        .json({
          statusCode: 400,
          error: STATUS_CODES[400],
          message: "Phone number already registered with another user",
        });
    }

    const numberDoc = await numberRecordExists(number);
    const newUser = await createUser(value, numberDoc[0].numberId);
    if (!newUser) {
      return res.status(500).json({
        statusCode: 500,
        error: STATUS_CODES[500],
        message: "Unexpected error while registering user",
      });
    }

    return res
      .status(200)
      .json({
        statusCode:200,
        message: "User registered successfully!"
      });

  } 
  catch(error){
    console.log(error);
    next(error);
  }
}

module.exports = signup;