import { Router, Request, Response, NextFunction } from "express";
import { Notification } from "../models/Notification";
import { requireAuthWithUser } from "../middleware/firebaseAuth";

const router: any = Router();

// All routes require authenticated user
router.use(requireAuthWithUser);

// GET /api/notifications — Get current user's notifications
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).dbUser;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 30));
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ recipient: user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ recipient: user._id }),
      Notification.countDocuments({ recipient: user._id, isRead: false }),
    ]);

    res.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/:id/read — Mark single notification as read
router.patch("/:id/read", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).dbUser;
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: user._id },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      res.status(404).json({ success: false, error: "Notification not found" });
      return;
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/read-all — Mark all notifications as read
router.patch("/read-all", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).dbUser;
    await Notification.updateMany(
      { recipient: user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    next(error);
  }
});

export default router;

