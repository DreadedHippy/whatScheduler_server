//Dependency imports
import { createClient } from 'redis';
import jwt from 'jsonwebtoken'
const redisUrl = process.env.REDIS_URL

//Testing out redis
const redisClient = createClient(redisUrl);

redisClient.on('error', err => console.log('Redis Client Error', err));

await redisClient.connect();

await redisClient.set('key', 'value');
const value = await redisClient.get('key');
console.log(value)

export async function cachedSchedules(req, res, next){
	try{
		const token = req.headers.authorization.split(" ")[1]
		const decodedToken = jwt.decode(token, {
			complete: true
		})
		const payloadEmail = decodedToken.payload.email;

		const cachedData = await redisClient.get(payloadEmail+"-schedules")

		if(cachedData){
			res.status(200).json({
				message: "Schedules retrieved",
				data: {schedules: JSON.parse(cachedData)},
				code: "200-getSchedules"
			})
			return
		}
		next()
	}catch(err){
		console.log(err)
	}
}

export async function cachedChats(req, res, next){
	try{
		const email = req.query.email;
		const cachedData = await redisClient.get(email+"-chats")

		if(cachedData){
			res.status(200).json({
				message: "Chats retrieved",
				data: {chats: JSON.parse(cachedData)},
				code: "200-getClientChats"
			})
			return
		}
		next()
	}catch(err){
		console.log(err)
		next()
	}
}

export async function cacheData(key, value, validity = 180){
	try{
		await redisClient.set(key, JSON.stringify(value), {
			EX: validity,
			NX: true
		})
	}catch(error){
		console.log("Redis cache error", error)
	}
}

/**
* @param {string} email - The email of the user
*/
export async function deleteCachedData(email){
	const key1 = email+"-chats";
	const key2 = email+"-schedules"
	const key3 = email+"-tasks"
	try{
		await redisClient.del(key1)
		await redisClient.del(key2)
		await redisClient.del(key3)
	}catch(error){
		console.log("Redis delete error: ", error)
	}
}

export async function cachedTasks(req, res, next){
	try{
		const email = req.query.email;
		const cachedData = await redisClient.get(email+"-tasks")

		if(cachedData){
			res.status(200).json({
				message: "Tasks retrieved",
				data: {tasks: JSON.parse(cachedData)},
				code: "200-getClientTasks"
			})
			return
		}
		next()
	}catch(err){
		console.log(err)
		next()
	}

}