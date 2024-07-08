const User = require('../models/User');

const addUser = async (ctx, next) => {
  const userId = ctx.from.id;

  let user = await User.findOne({ userId });

  if (!user) {
    user = new User({
      userId,
      username: ctx.from.username,
      firstName: ctx.from.first_name,
      lastName: ctx.from.last_name,
      language: ctx.from.language_code,
      is_premium: ctx.from.is_premium,
    });
    await user.save();
    console.log(`New user added: ${user.username}`);
  } else {
    const updateFields = {};
    if (user.username !== ctx.from.username) updateFields.username = ctx.from.username;
    if (user.firstName !== ctx.from.first_name) updateFields.firstName = ctx.from.first_name;
    if (user.lastName !== ctx.from.last_name) updateFields.lastName = ctx.from.last_name;
    if (user.language !== ctx.from.language_code) updateFields.language = ctx.from.language_code;
    if (user.is_premium !== ctx.from.is_premium) updateFields.is_premium = ctx.from.is_premium;

    if (Object.keys(updateFields).length > 0) {
      await User.updateOne({ userId }, { $set: updateFields });
      console.log(`User updated: ${ctx.from.username}`);
    }
  }


  await next();
};

module.exports = addUser;
