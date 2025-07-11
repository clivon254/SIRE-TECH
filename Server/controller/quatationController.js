import Quatation from "../model/quatationModel.js";
import { errorHandler } from "../utils/error.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import Client from "../model/clientModel.js";
import Project from "../model/projectModel.js";
import transporter from "../utils/nodemailer.js";


// Helper to generate PDF and return the file URL
const generateQuotationPDF = async (quotation, req, subtotal, vat, total) => {
    // Ensure the public/quotations directory exists
    const dir = path.join(process.cwd(), "public", "quotations");
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Fetch client and project details
    const client = quotation.clientId ? await Client.findById(quotation.clientId) : null;
    const project = quotation.projectId ? await Project.findById(quotation.projectId) : null;

    // File name and path
    const fileName = `quotation_${quotation._id}.pdf`;
    const filePath = path.join(dir, fileName);

    // Create PDF
    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(fs.createWriteStream(filePath));

    // SIRE TECH Info
    doc.fontSize(18).text("SIRE TECH", { align: "center", underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).text("Email: siretech@info.com", { align: "center" });
    doc.text("Phone: 0111202895", { align: "center" });
    doc.moveDown(1);

    // Quotation Title
    doc.fontSize(16).text("Quotation", { align: "center" });
    doc.moveDown();

    // Project Title
    if (project) {
        doc.fontSize(12).text(`Project: ${project.title}`);
    }
    // Client Info
    if (client) {
        doc.fontSize(10).text(`Client: ${client.name}`);
        doc.text(`Client Email: ${client.email}`);
        doc.text(`Client Phone: ${client.phone}`);
    }
    doc.moveDown();


    // Dates
    doc.fontSize(10).text(`Issue Date: ${quotation.issueDate ? new Date(quotation.issueDate).toLocaleDateString() : ""}`);
    doc.text(`Expiry Date: ${quotation.expiryDate ? new Date(quotation.expiryDate).toLocaleDateString() : ""}`);
    doc.moveDown();

    // Description
    if (quotation.description) {
        // If description contains HTML, render it as rich text
        if (/<[a-z][\s\S]*>/i.test(quotation.description)) {
            renderHtmlToPdf(doc, quotation.description, { fontSize: 12 });
        } else {
            doc.fontSize(12).text(quotation.description);
        }
        doc.moveDown();
    }

    // Items Table
    doc.fontSize(12).text("Items:");
    const tableTop = doc.y + 5;
    const itemColWidths = [30, 200, 60, 60]; // #, Desc, Qty, Rate
    const tableLeft = 40;
    const rowHeight = 18;
    const cellPadding = 4; // Padding for table cells

    // Table Header
    doc.fontSize(10)
       .text("#", tableLeft + cellPadding, tableTop + cellPadding, { width: itemColWidths[0] - 2 * cellPadding, align: "left" })
       .text("Description", tableLeft + itemColWidths[0] + cellPadding, tableTop + cellPadding, { width: itemColWidths[1] - 2 * cellPadding, align: "left" })
       .text("Qty", tableLeft + itemColWidths[0] + itemColWidths[1] + cellPadding, tableTop + cellPadding, { width: itemColWidths[2] - 2 * cellPadding, align: "left" })
       .text("Rate", tableLeft + itemColWidths[0] + itemColWidths[1] + itemColWidths[2] + cellPadding, tableTop + cellPadding, { width: itemColWidths[3] - 2 * cellPadding, align: "left" });

    // Draw header border
    doc.rect(tableLeft, tableTop - 2, itemColWidths.reduce((a, b) => a + b, 0), rowHeight).stroke();

    let y = tableTop + rowHeight;

    // Table Rows
    quotation.items.forEach((item, idx) => {
        // Draw row border
        doc.rect(tableLeft, y - 2, itemColWidths.reduce((a, b) => a + b, 0), rowHeight).stroke();

        doc.text(`${idx + 1}`, tableLeft + cellPadding, y + cellPadding, { width: itemColWidths[0] - 2 * cellPadding, align: "left" })
           .text(item.desc, tableLeft + itemColWidths[0] + cellPadding, y + cellPadding, { width: itemColWidths[1] - 2 * cellPadding, align: "left" })
           .text(item.qty.toString(), tableLeft + itemColWidths[0] + itemColWidths[1] + cellPadding, y + cellPadding, { width: itemColWidths[2] - 2 * cellPadding, align: "left" })
           .text(item.rate.toString(), tableLeft + itemColWidths[0] + itemColWidths[1] + itemColWidths[2] + cellPadding, y + cellPadding, { width: itemColWidths[3] - 2 * cellPadding, align: "left" });
        y += rowHeight;
    });

    // Add Subtotal, VAT, and Total as table rows with borders
    const summaryRows = [
        { label: "Subtotal", value: subtotal },
        { label: "VAT", value: vat },
        { label: "Total", value: total }
    ];

    summaryRows.forEach(row => {
        // Draw row border
        doc.rect(tableLeft, y - 2, itemColWidths.reduce((a, b) => a + b, 0), rowHeight).stroke();

        // Empty cells for #, Description, label in Qty, value in Rate
        doc.text("", tableLeft + cellPadding, y + cellPadding, { width: itemColWidths[0] - 2 * cellPadding, align: "left" })
           .text("", tableLeft + itemColWidths[0] + cellPadding, y + cellPadding, { width: itemColWidths[1] - 2 * cellPadding, align: "left" })
           .text(row.label, tableLeft + itemColWidths[0] + itemColWidths[1] + cellPadding, y + cellPadding, { width: itemColWidths[2] - 2 * cellPadding, align: "left" })
           .text(row.value.toString(), tableLeft + itemColWidths[0] + itemColWidths[1] + itemColWidths[2] + cellPadding, y + cellPadding, { width: itemColWidths[3] - 2 * cellPadding, align: "left" });
        y += rowHeight;
    });

    doc.moveDown(2);

    // Signature lines (left and right)
    const signatureY = doc.y + 40;
    doc.fontSize(12);
    doc.text("SIRE TECH: ________________________", tableLeft, signatureY, { align: "left" });
    doc.text("Client: ___________________________", 350, signatureY, { align: "left" });

    doc.end();

    // Return the full URL (not just a path)
    const protocol = req.protocol;
    const host = req.get('host');
    return `${protocol}://${host}/quotations/${fileName}`;
};


// Helper to render basic HTML (p, ul, li) in PDFKit
function renderHtmlToPdf(doc, html, options = {}) {
    const { bulletIndent = 20, lineGap = 4, fontSize = 12 } = options;
    doc.fontSize(fontSize);

    // Simple regex-based parser for <p>, <ul>, <li>
    // This is not a full HTML parser, but works for simple rich text
    const paragraphRegex = /<p>(.*?)<\/p>/gis;
    const ulRegex = /<ul>(.*?)<\/ul>/gis;
    const liRegex = /<li>(.*?)<\/li>/gis;

    let lastIndex = 0;
    let match;

    // Render paragraphs and lists in order of appearance
    while (lastIndex < html.length) {
        // Find next <p> or <ul>
        const pMatch = paragraphRegex.exec(html);
        const ulMatch = ulRegex.exec(html);

        // Determine which comes first
        let nextTag, nextIndex;
        if (pMatch && (!ulMatch || pMatch.index < ulMatch.index)) {
            nextTag = 'p';
            nextIndex = pMatch.index;
        } else if (ulMatch) {
            nextTag = 'ul';
            nextIndex = ulMatch.index;
        } else {
            break;
        }

        // Render any text before the next tag as plain text
        if (nextIndex > lastIndex) {
            const text = html.substring(lastIndex, nextIndex).replace(/<[^>]+>/g, '').trim();
            if (text) {
                doc.text(text, { lineGap });
                doc.moveDown(0.5);
            }
        }

        if (nextTag === 'p') {
            const text = pMatch[1].replace(/<br\s*\/?>/g, '\n').trim();
            doc.text(text, { lineGap });
            doc.moveDown(0.5);
            lastIndex = paragraphRegex.lastIndex;
        } else if (nextTag === 'ul') {
            const ulContent = ulMatch[1];
            let li;
            while ((li = liRegex.exec(ulContent)) !== null) {
                const text = li[1].replace(/<br\s*\/?>/g, '\n').trim();
                doc.text(`• ${text}`, { indent: bulletIndent, lineGap });
            }
            doc.moveDown(0.5);
            lastIndex = ulRegex.lastIndex;
        }
    }

    // Render any remaining text after the last tag
    if (lastIndex < html.length) {
        const text = html.substring(lastIndex).replace(/<[^>]+>/g, '').trim();
        if (text) {
            doc.text(text, { lineGap });
            doc.moveDown(0.5);
        }
    }
}


export const createQuotation = async (req, res, next) => {
    try {
        if (!req.user.isAdmin) {
            return next(errorHandler(403, "Only admin can create quotations"));
        }

        // Remove issueDate and expiryDate from destructuring
        const { projectId, items, status, description, clientId } = req.body;

        // Remove issueDate and expiryDate from required fields check
        if (!projectId || !items || !description || !clientId) {
            return next(errorHandler(400, "Missing required fields"));
        }

        // Set default dates
        const issueDate = new Date();
        const expiryDate = new Date();
        expiryDate.setDate(issueDate.getDate() + 14);

        // Calculate subtotal, vat, total
        const subtotal = items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
        const vat = +(subtotal * 0.05).toFixed(2);
        const total = +(subtotal + vat).toFixed(2);

        // Create the quotation (do NOT include issueDate/expiryDate in DB)
        const quotation = new Quatation({
            projectId,
            clientId,
            items,
            status,
            description
        });

        await quotation.save();

        // Pass the dates to the PDF generator
        const pdfUrl = await generateQuotationPDF(
            { ...quotation.toObject(), issueDate, expiryDate }, // pass dates for PDF
            req,
            subtotal,
            vat,
            total
        );

        // Update the quotation with the PDF URL
        quotation.url = pdfUrl;
        await quotation.save();

        res.status(201).json({
            success: true,
            message: "Quotation created and PDF generated",
            quotation: {
                ...quotation.toObject(),
                issueDate,
                expiryDate,
                subtotal,
                vat,
                total
            }
        });
    } catch (error) {
        next(error);
    }
};


export const getQuatation = async (req, res, next) => {
    const { quatationId } = req.params;
    try {
        const quatation = await Quatation.findById(quatationId);
        if (!quatation) {
            return next(errorHandler(404, "Quatation not found "));
        }
        const subtotal = quatation.items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
        const vat = +(subtotal * 0.05).toFixed(2);
        const total = +(subtotal + vat).toFixed(2);

        // Use createdAt as issueDate, and expiryDate as 14 days after
        const issueDate = quatation.createdAt;
        const expiryDate = new Date(new Date(issueDate).getTime() + 14 * 24 * 60 * 60 * 1000);

        res.status(200).json({
            success: true,
            quatation: {
                ...quatation.toObject(),
                issueDate,
                expiryDate,
                subtotal,
                vat,
                total
            }
        });
    } catch (error) {
        next(error);
    }
};


export const getQuatations = async (req, res, next) => {
    try {
        // Sort by createdAt descending (newest first)
        const quatations = await Quatation.find().sort({ createdAt: -1 });
        const result = quatations.map(q => {
            const subtotal = q.items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
            const vat = +(subtotal * 0.05).toFixed(2);
            const total = +(subtotal + vat).toFixed(2);

            // Use createdAt as issueDate, and expiryDate as 14 days after
            const issueDate = q.createdAt;
            const expiryDate = new Date(new Date(issueDate).getTime() + 14 * 24 * 60 * 60 * 1000);

            return {
                ...q.toObject(),
                issueDate,
                expiryDate,
                subtotal,
                vat,
                total
            };
        });
        res.status(200).json({ success: true, quatations: result });
    } catch (error) {
        next(error);
    }
};


export const updateQuatation = async (req, res, next) => {
    if (!req.user.isAdmin) {
        return next(errorHandler(403, "You are not allowed to update the quatation"));
    }

    const { quatationId } = req.params;

    try {
        let quatation = await Quatation.findById(quatationId);

        if (!quatation) {
            return next(errorHandler(404, "quatation not found "));
        }

        // Allowed statuses (sync with model)
        const allowedStatuses = ["Draft", "Sent", "Approved", "Expired", "Oksy"];

        const updateData = {};

        // Only update fields if provided
        if (req.body.status) {
            if (!allowedStatuses.includes(req.body.status)) {
                return next(errorHandler(400, "Invalid status value"));
            }
            updateData.status = req.body.status;
        }
        if (req.body.description) updateData.description = req.body.description;

        if (req.body.items) updateData.items = req.body.items;
        // These are not in the DB by default, but we allow updating for PDF
        let issueDate = req.body.issueDate ? new Date(req.body.issueDate) : quatation.createdAt;

        let expiryDate = req.body.expiryDate ? new Date(req.body.expiryDate) : new Date(new Date(issueDate).getTime() + 14 * 24 * 60 * 60 * 1000);

        // Update the document
        quatation = await Quatation.findByIdAndUpdate(
            quatationId,
            { $set: updateData },
            { new: true }
        );

        // Recalculate subtotal, vat, total
        const items = req.body.items || quatation.items;
        const subtotal = items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
        const vat = +(subtotal * 0.05).toFixed(2);
        const total = +(subtotal + vat).toFixed(2);

        // Regenerate PDF and update URL
        const pdfUrl = await generateQuotationPDF(
            { ...quatation.toObject(), issueDate, expiryDate, items },
            req,
            subtotal,
            vat,
            total
        );

        quatation.url = pdfUrl;
        
        await quatation.save();

        res.status(200).json({
            success: true,
            quatation: {
                ...quatation.toObject(),
                issueDate,
                expiryDate,
                subtotal,
                vat,
                total
            }
        });

    } catch (error) {
        next(error);
    }
};


export const deleteQuatation = async (req,res,next) => {

    if(!req.user.isAdmin)
    {
        return next(errorHandler(403,"You are not allowed to update the quatation"))
    }
    
    const {quatationId} = req.params

    try
    {
        const quatation = await Quatation.findById(quatationId)

        if(!quatation)
        {
            return next(errorHandler(404,"quatation not found "))
        }

        await Quatation.findByIdAndDelete(quatationId)

        res.status(200).json({success:true , message:`Quatation deleted success fully`})

    }
    catch(error)
    {
        next(error)
    }

}


export const sendQuotationEmail = async (req, res, next) => {

    // Admin check
    if (!req.user.isAdmin) 
    {
        return next(errorHandler(403, "Only admin can send quotation emails"));
    }

    const { quatationId } = req.params;

    try 
    {
        // Find the quotation
        const quatation = await Quatation.findById(quatationId);

        if (!quatation) 
        {
            return next(errorHandler(404, "Quotation not found"));
        }

        // Find the client
        const client = await Client.findById(quatation.clientId);

        if (!client) 
        {
            return next(errorHandler(404, "Client not found"));
        }

        // Compose the email with HTML
        const mailOptions = {
            from: "SIRE TECH SUPPORT <" + process.env.AUTH_USER + ">",
            to: client.email,
            subject: "Your Quotation from SIRE TECH",
            html: `
                <div style="background: #fff; padding: 32px 0; font-family: Arial, sans-serif; color: #660000;">
                  <div style="max-width: 520px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(208,0,0,0.08); border: 1px solid #222;">
                    <div style="text-align: center; padding: 24px 0 8px 0;">
                      <img src="https://i.imgur.com/yourlogo.png" alt="SIRE TECH Logo" style="height: 70px; margin-bottom: 8px;" />
                      <h1 style="color: #D80000; margin: 0; font-size: 2.2em; letter-spacing: 2px; font-style: italic;">SIRE TECH</h1>
                    </div>
                    <div style="padding: 0 32px 24px 32px;">
                      <h2 style="color: #A30000; margin-top: 16px;">Hello ${client.name} 👋,</h2>
                      <p style="font-size: 1.1em; color: #660000; margin-bottom: 18px;">
                        Thank you for choosing <span style="color: #D80000; font-weight: bold;">SIRE TECH</span>! 🚀<br>
                        We are excited to send you your quotation for the requested project.<br>
                        Please review the quotation carefully and let us know if you have any questions.
                      </p>
                      <div style="background: #FFF3F3; border-left: 5px solid #D80000; padding: 18px 20px; border-radius: 8px; margin-bottom: 18px;">
                        <p style="margin: 0; color: #A30000; font-size: 1.08em;">
                          <strong>To view and sign your quotation, please click the button below:</strong>
                        </p>
                        <div style="text-align: center; margin: 18px 0;">
                          <a href="${quatation.url}" style="background: #CC0000; color: #fff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-size: 1.1em; font-weight: bold; letter-spacing: 1px; display: inline-block;">
                            📄 View & Sign Quotation
                          </a>
                        </div>
                        <p style="margin: 0; color: #660000; font-size: 0.98em;">
                          If the button above does not work, copy and paste this link into your browser:<br>
                          <span style="color: #D80000; word-break: break-all;">${quatation.url}</span>
                        </p>
                      </div>
                      <p style="color: #660000; font-size: 1em;">
                        If you have any questions or need further assistance, feel free to reply to this email.<br>
                        <br>
                        Best regards,<br>
                        <span style="color: #D80000; font-weight: bold;">SIRE TECH Team</span> 🤝
                      </p>
                    </div>
                  </div>
                  <div style="text-align: center; background: #660000; color: #fff; font-size: 0.95em; margin-top: 18px; border-radius: 0 0 12px 12px; padding: 12px 0;">
                    <span>© ${new Date().getFullYear()} SIRE TECH. All rights reserved.</span>
                  </div>
                </div>
            `
        };

        // Send the email
        transporter.sendMail(mailOptions, (error, info) => {

            if (error) 
            {
                console.log(error);

                return next(errorHandler(500, "Failed to send email"));

            } 
            else 
            {
                console.log("Email sent: " + info.response);

                res.status(200).json({ success: true, message: "Quotation email sent to client" });
            }

        });

    } catch (error) {
        next(error);
    }
};