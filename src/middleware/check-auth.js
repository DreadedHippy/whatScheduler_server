import jwt from 'jsonwebtoken'

export default ( req, res, next ) => {
  try{
    const token = req.headers.authorization.split(" ")[1]
		console.log(token)
    jwt.verify(token, process.env.JWT_SECRET)
    next();
  } catch (error) {
    res.status(401).json({ message: 'Auth failed!' });
  }
}