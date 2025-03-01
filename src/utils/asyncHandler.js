const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}



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

export default  asyncHandler

