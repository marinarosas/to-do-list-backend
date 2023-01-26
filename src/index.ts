import express, { Request, Response } from 'express'
import cors from 'cors'
import {db} from './database/knex'
import { idText } from 'typescript'
import { TTasksDB, TUserDB } from './type'

const app = express()

app.use(cors())
app.use(express.json())

app.listen(3003, () => {
    console.log(`Servidor rodando na porta ${3003}`)
})


//Regex
const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,12}$/g
const regexEmail = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g

app.get("/ping", async (req: Request, res: Response) => {
    try {
        res.status(200).send({ message: "Pong!" })
    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

app.get("/users", async (req: Request, res: Response) => {
    try {
        const searchTerm = req.query.q as string | undefined

        if(searchTerm === undefined){
            const result = await db("users")
            res.status(200).send(result)
        } else {
            const result = await db("users").where("name", "LIKE", `%${searchTerm}%`)
            res.status(200).send(result)
        }

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

app.post("/users", async (req: Request, res: Response) => {
    try {
        
        const {id, name, email, password} = req.body

        if(!id || !name || !email || !password){
            res.status(400)
            throw new Error("Id, name, email ou password não informado")
        }

        if(typeof id !== "string" &&
        typeof name !== "string" &&
        typeof email !== "string" &&
        typeof password !== "string"){
            res.status(400)
            throw new Error("Id, name, email e password são strings.")
        }

        if(id.length <= 3){
            res.status(400)
            throw new Error("Id tem que ter pelo menos 4 caratcteres.")
        }

        if (!password.match(regexPassword)) {
			throw new Error("'password' deve possuir entre 8 e 12 caracteres, com letras maiúsculas e minúsculas e no mínimo um número e um caractere especial")
		}

        if (!email.match(regexEmail)) {
            throw new Error("Parâmetro 'email' inválido")
        }

        const [userIdAlreadyExist]: TUserDB[] | undefined = await db("users").where({id: id})

        if(userIdAlreadyExist){
            res.status(400)
            throw new Error("Id já existe.")
        }

        const [userEmailAlreadyExist]: TUserDB[] | undefined = await db("users").where({email: email})

        if(userEmailAlreadyExist){
            res.status(400)
            throw new Error("Email já existe.")
        }

        const newUser: TUserDB = {
            id,
            name,
            email,
            password
        }

        await db("users").insert(newUser)
        res.status(201).send({
            message: "User criado com sucesso",
            user: newUser
        })

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

app.delete("/users/:id", async (req: Request, res: Response) => {
    try {
        const idToDelete = req.params.id

        if(idToDelete[0] !== "f"){
            res.status(400)
            throw new Error("'id' deve inicar com a letra 'f'")
        }

        const [userIdAlreadyExist]: TUserDB[] | undefined = await db("users").where({id: idToDelete})

        if(!userIdAlreadyExist){
            res.status(404)
            throw new Error("Id não encontrado")
        }

        await db("users").del().where({id: idToDelete})
        res.status(200).send({message: "User deletado com sucesso"})

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

app.get("/tasks", async (req: Request, res: Response) => {
    try {
        const searchTerm = req.query.q as string | undefined

        if(searchTerm === undefined){
            const result = await db("tasks")
            res.status(200).send(result)
        } else {
            const result = await db("tasks")
                .where("title", "LIKE", `%${searchTerm}%`)
                .orWhere("description", "LIKE", `%${searchTerm}%`)
            res.status(200).send(result)
        }

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

app.post("/tasks", async (req: Request, res: Response) => {
    try {
        
        const {id, title, description} = req.body

        if(id[0] !== "t"){
            res.status(400)
            throw new Error("O id deve iniciar com 't'")
        }

        if(!id || !title || !description){
            res.status(400)
            throw new Error("Id, title ou description não informado")
        }

        if(typeof id !== "string" &&
        typeof title !== "string" &&
        typeof description !== "string"){
            res.status(400)
            throw new Error("Id, title e description são strings.")
        }

        if(id.length <= 3){
            res.status(400)
            throw new Error("Id tem que ter pelo menos 4 caratcteres.")
        }

        if(title.length < 2){
            res.status(400)
            throw new Error("Title tem que ter mais de 2 caracteres")
        }

        const [tasksIdAlreadyExist]: TTasksDB[] | undefined = await db("tasks").where({id: id})

        if(tasksIdAlreadyExist){
            res.status(400)
            throw new Error("Id já existe.")
        }

        const newTasks = {
            id,
            title,
            description
        }

        await db("tasks").insert(newTasks)

        const [insertedTask]: TTasksDB[] = await db("tasks").where({id})

        res.status(201).send({
            message: "Task criada com sucesso",
            task: insertedTask
        })

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

app.put("/tasks/:id", async (req: Request, res: Response) => {
    try {
        const idToEdit = req.params.id
        
        //const {id, title, description, createdAt, status} = req.body
        const newId = req.body.id
        const newTitle = req.body.title
        const newDescription = req.body.description
        const newCreatedAt = req.body.createdAt
        const newStatus = req.body.status

        const [task]: TTasksDB[] | undefined = await db("tasks").where({id: idToEdit})

        if(!task){
            res.status(404)
            throw new Error("Id não encontrado.")
        }

        if(newId !== undefined){
            if(typeof newId !== "string"){
            res.status(400)
            throw new Error("Id deve ser uma strings.")
        }
        if(newId.length < 3){
            res.status(400)
            throw new Error("Id tem que ter pelo menos 4 caratcteres.")
        }
        if(newId[0] !== "t"){
            res.status(400)
            throw new Error("O id deve iniciar com 't'")
        }
        }

        if(newTitle !== undefined){
            if(typeof newTitle !== "string"){
            res.status(400)
            throw new Error("Title deve ser uma strings.")
        }
        if(newTitle.length < 2){
            res.status(400)
            throw new Error("Title tem que ter mais de 2 caracteres")
        }
        }

        if(newDescription !== undefined){
            if(typeof newDescription !== "string"){
            res.status(400)
            throw new Error("Description deve ser uma strings.")
        }
        }

        if(newCreatedAt !== undefined){
            if(typeof newCreatedAt !== "string"){
                res.status(400)
                throw new Error("'createAt' deve ser uma string")
            }
        }


        if(newStatus !== undefined){
            if(typeof newStatus !== "number"){
                res.status(400)
                throw new Error("'status' tem que ser um número (0 para incompleta ou 1 para completa)")
            }
        }
        

        const newTasks: TTasksDB = {
            id: newId || task.id,
            title: newTitle || task.title,
            description: newDescription || task.description,
            created_at: newCreatedAt || task.created_at,
            status: isNaN(newStatus) ? task.status : newStatus
        }

        await db("tasks").update(newTasks).where({ id: idToEdit })

        res.status(200).send({
            message: "Task editada com sucesso",
            task: newTasks
        })

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})

app.delete("/tasks/:id", async (req: Request, res: Response) => {
    try {
        const idToDelete = req.params.id

        if(idToDelete[0] !== "t"){
            res.status(400)
            throw new Error("'id' deve iniciar com a letra 't'")
        }

        const [taskExist]: TTasksDB[] | undefined = await db("tasks").where({id: idToDelete})

        if(!taskExist){
            res.status(404)
            throw new Error("Id não encontrado")
        }

        await db("tasks").del().where({id: idToDelete})
        res.status(200).send({message: "User deletado com sucesso"})

    } catch (error) {
        console.log(error)

        if (req.statusCode === 200) {
            res.status(500)
        }

        if (error instanceof Error) {
            res.send(error.message)
        } else {
            res.send("Erro inesperado")
        }
    }
})