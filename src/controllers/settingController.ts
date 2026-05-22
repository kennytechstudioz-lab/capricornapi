import { Request, Response } from "express";
import Setting from "../models/Setting";

/**
 * Controller: Fetches the single global system configuration document.
 * If none exists in MongoDB, automatically creates one with system defaults.
 */
export async function getSettings(req: Request, res: Response) {
  try {
    let setting = await Setting.findOne({});
    if (!setting) {
      // Auto-initialize standard default configurations
      setting = await Setting.create({});
    }
    return res.status(200).json({
      success: true,
      setting,
    });
  } catch (error: any) {
    console.error("✗ Error in getSettings controller:", error);
    return res.status(500).json({
      error: "Internal server error retrieving system configurations.",
    });
  }
}

/**
 * Controller: Updates/upserts the global system configurations.
 */
export async function updateSettings(req: Request, res: Response) {
  try {
    const { companyName, domainName, email, phone, address, description, showCurrency, registrationLink, documents, mapEmbed } = req.body;

    let setting = await Setting.findOne({});
    if (!setting) {
      setting = new Setting();
    }

    // Apply values if defined in the payload parameters
    setting.companyName = companyName !== undefined ? companyName.trim() : setting.companyName;
    setting.domainName = domainName !== undefined ? domainName.trim() : setting.domainName;
    setting.email = email !== undefined ? email.trim() : setting.email;
    setting.phone = phone !== undefined ? phone.trim() : setting.phone;
    setting.address = address !== undefined ? address.trim() : setting.address;
    setting.description = description !== undefined ? description.trim() : setting.description;
    setting.showCurrency = showCurrency !== undefined ? Boolean(showCurrency) : setting.showCurrency;
    if (registrationLink !== undefined) (setting as any).registrationLink = String(registrationLink).trim();
    if (documents !== undefined) (setting as any).documents = documents;
    if (mapEmbed !== undefined) (setting as any).mapEmbed = String(mapEmbed);

    await setting.save();

    console.log("✓ System settings updated successfully by admin administrator.");

    return res.status(200).json({
      success: true,
      setting,
    });
  } catch (error: any) {
    console.error("✗ Error in updateSettings controller:", error);
    return res.status(500).json({
      error: "Internal server error deploying system settings changes.",
    });
  }
}
