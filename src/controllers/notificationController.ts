import { Request, Response } from "express";
import { Notification } from "../models/Notification";

/**
 * Retrieves all notifications for a specific user or system admin.
 * Ordered by newest first.
 */
export async function getNotifications(req: Request, res: Response) {
  try {
    const { username, page = "1", limit = "20" } = req.query;
    if (!username) {
      return res.status(400).json({ error: "Missing required username parameter." });
    }

    const lowerUsername = String(username).toLowerCase().trim();
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
    const skip = (pageNum - 1) * limitNum;
    const query = { username: lowerUsername };

    const [list, total] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Notification.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      notifications: list,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      page: pageNum,
    });
  } catch (error: any) {
    console.error("✗ Error in getNotifications controller:", error);
    return res.status(500).json({ error: "Internal server error querying notifications catalog." });
  }
}

/**
 * Marks a single notification as read.
 * Checks whether it's an admin reading or a standard user to set the appropriate read flag.
 */
export async function markAsRead(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { username } = req.body;

    if (!id || !username) {
      return res.status(400).json({ error: "Missing required notification ID or username parameter." });
    }

    const lowerUsername = String(username).toLowerCase().trim();
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ error: "Target notification not found." });
    }

    if (lowerUsername === "admin") {
      notification.isAdminRead = true;
    } else {
      notification.isRead = true;
    }

    await notification.save();

    return res.status(200).json({
      success: true,
      notification,
    });
  } catch (error: any) {
    console.error("✗ Error in markAsRead controller:", error);
    return res.status(500).json({ error: "Internal server error updating notification read status." });
  }
}

/**
 * Bulk updates all unread notifications to read state for a specific user or admin.
 */
export async function markAllAsRead(req: Request, res: Response) {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Missing required username parameter." });
    }

    const lowerUsername = String(username).toLowerCase().trim();

    if (lowerUsername === "admin") {
      // Bulk update administrative flags
      await Notification.updateMany(
        { username: "admin", isAdminRead: false },
        { isAdminRead: true }
      );
    } else {
      // Bulk update standard user flags
      await Notification.updateMany(
        { username: lowerUsername, isRead: false },
        { isRead: true }
      );
    }

    return res.status(200).json({
      success: true,
      message: "All notifications updated to read state successfully.",
    });
  } catch (error: any) {
    console.error("✗ Error in markAllAsRead controller:", error);
    return res.status(500).json({ error: "Internal server error performing bulk read update." });
  }
}
