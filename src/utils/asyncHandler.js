const asyncHandler = (requestHandler) => {
    return (req, res, next) => {  // ✅ Now returning the function
        Promise
        .resolve(requestHandler(req, res, next))
        .catch((err) => next(err));  // ✅ Passes error to Express error handler
    };
};


// const AsyncHandlerq = (fn) = (res,req,next) =>{
//   try {
//     fn(res,req,next)
//   } catch (error) {
//     res.status(error.code || 500).json({
//         message: error.message,
//         success:false
//     })
//   }
// }

export {asyncHandler}

