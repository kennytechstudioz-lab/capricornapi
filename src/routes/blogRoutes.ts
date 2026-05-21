import { Router } from "express";
import { getAllBlogs, createBlog, updateBlog, deleteBlog } from "../controllers/blogController";

const router = Router();

router.get("/", getAllBlogs);
router.post("/", createBlog);
router.put("/:id", updateBlog);
router.delete("/:id", deleteBlog);

export default router;
