import express from "express";
import userRoutes from "./src/routes/user.route";
import contestRoutes from "./src/routes/contest.routes";
import problemRoutes from "./src/routes/problem.routes"

const app = express();

app.use(express.json());

app.use("/api/auth", userRoutes);
app.use("/api/contests", contestRoutes);
app.use("/api/problems",problemRoutes)

app.listen(3000,()=>{
    console.log("Server is running on port 3000...")
})
