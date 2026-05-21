import { Request, Response } from "express";
import { NotificationTemplate } from "../models/NotificationTemplate";
import { EmailTemplate } from "../models/EmailTemplate";

// ==========================================
// Notification Templates CRUD
// ==========================================

export async function createNotificationTemplate(req: Request, res: Response) {
  try {
    const { name, title, content } = req.body;
    if (!name || !title || !content) {
      return res.status(400).json({ error: "Missing required fields (name, title, content)." });
    }

    const template = await NotificationTemplate.create({
      name: name.trim(),
      title: title.trim(),
      content: content.trim(),
    });

    return res.status(201).json({ success: true, template });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "A template with this name already exists." });
    }
    console.error("✗ Error creating notification template:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}

export async function getNotificationTemplates(req: Request, res: Response) {
  try {
    const templates = await NotificationTemplate.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, templates });
  } catch (error: any) {
    console.error("✗ Error fetching notification templates:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}

export async function updateNotificationTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, title, content } = req.body;

    const template = await NotificationTemplate.findById(id);
    if (!template) {
      return res.status(404).json({ error: "Notification template not found." });
    }

    if (name !== undefined) template.name = name.trim();
    if (title !== undefined) template.title = title.trim();
    if (content !== undefined) template.content = content.trim();

    await template.save();

    return res.status(200).json({ success: true, template });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "A template with this name already exists." });
    }
    console.error("✗ Error updating notification template:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}

export async function deleteNotificationTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const template = await NotificationTemplate.findByIdAndDelete(id);
    if (!template) {
      return res.status(404).json({ error: "Notification template not found." });
    }
    return res.status(200).json({ success: true, message: "Template deleted successfully." });
  } catch (error: any) {
    console.error("✗ Error deleting notification template:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}

// ==========================================
// Email Templates CRUD
// ==========================================

export async function createEmailTemplate(req: Request, res: Response) {
  try {
    const { name, title, greeting, content, banner } = req.body;
    if (!name || !title || !content) {
      return res.status(400).json({ error: "Missing required fields (name, title, content)." });
    }

    const template = await EmailTemplate.create({
      name: name.trim(),
      title: title.trim(),
      greeting: (greeting || "Hi {{username}},").trim(),
      content: content.trim(),
      banner: (banner || "").trim(),
    });

    return res.status(201).json({ success: true, template });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "A template with this name already exists." });
    }
    console.error("✗ Error creating email template:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}

export async function getEmailTemplates(req: Request, res: Response) {
  try {
    const templates = await EmailTemplate.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, templates });
  } catch (error: any) {
    console.error("✗ Error fetching email templates:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}

export async function updateEmailTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, title, greeting, content, banner } = req.body;

    const template = await EmailTemplate.findById(id);
    if (!template) {
      return res.status(404).json({ error: "Email template not found." });
    }

    if (name !== undefined) template.name = name.trim();
    if (title !== undefined) template.title = title.trim();
    if (greeting !== undefined) template.greeting = greeting.trim();
    if (content !== undefined) template.content = content.trim();
    if (banner !== undefined) template.banner = (banner || "").trim();

    await template.save();

    return res.status(200).json({ success: true, template });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "A template with this name already exists." });
    }
    console.error("✗ Error updating email template:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}

export async function deleteEmailTemplate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const template = await EmailTemplate.findByIdAndDelete(id);
    if (!template) {
      return res.status(404).json({ error: "Email template not found." });
    }
    return res.status(200).json({ success: true, message: "Template deleted successfully." });
  } catch (error: any) {
    console.error("✗ Error deleting email template:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}
