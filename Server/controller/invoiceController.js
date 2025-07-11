import Invoice from "../model/invoiceModel.js";
import { errorHandler } from "../utils/error.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import Client from "../model/clientModel.js";
import Project from "../model/projectModel.js";
import transporter from "../utils/nodemailer.js"; // Make sure this import is at the top

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

// Helper to generate PDF and return the file URL
const generateInvoicePDF = async (invoice, req, subtotal, vat, total, issueDate, dueDate) => {

    // Ensure the public/invoices directory exists
    const dir = path.join(process.cwd(), "public", "invoices");

    if (!fs.existsSync(dir)) 
    {
        fs.mkdirSync(dir, { recursive: true });
    }


    // Fetch client and project details
    const client = invoice.clientId ? await Client.findById(invoice.clientId) : null;

    const project = invoice.projectId ? await Project.findById(invoice.projectId) : null;


    // File name and path
    const fileName = `invoice_${invoice._id}.pdf`;

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

    // Invoice Title
    doc.fontSize(16).text("Invoice", { align: "center" });
    doc.moveDown();

    // Invoice Number
    if (invoice.invoiceNo) {
        doc.fontSize(12).text(`Invoice Number: ${invoice.invoiceNo}`);
    }

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
    doc.fontSize(10).text(`Issue Date: ${issueDate ? new Date(issueDate).toLocaleDateString() : ""}`);
    doc.text(`Due Date: ${dueDate ? new Date(dueDate).toLocaleDateString() : ""}`);
    doc.moveDown();

    // Description
    if (invoice.description) {
        // If description contains HTML, render it as rich text
        if (/<[a-z][\s\S]*>/i.test(invoice.description)) {
            renderHtmlToPdf(doc, invoice.description, { fontSize: 12 });
        } else {
            doc.fontSize(12).text(invoice.description);
        }
        doc.moveDown();
    }

    // Items Table (Quotation style)
    doc.fontSize(12).text("Items:");
    doc.moveDown(0.5);

    // Table Header
    doc.fontSize(10).text(
      "#   Description                                 Qty    Rate",
      { continued: false }
    );

    // Table Rows
    (invoice.items || []).forEach((item, idx) => {
      doc.fontSize(10).text(
        `${idx + 1}   ${item.desc.padEnd(40, ' ')}   ${item.qty}    ${item.rate}`,
        { continued: false }
      );
    });

    // Add Subtotal, VAT, and Total
    doc.moveDown(1);
    doc.fontSize(10).text(`Subtotal: ${subtotal}`);
    doc.text(`VAT: ${vat}`);
    doc.text(`Total: ${total}`);
    doc.moveDown(2);

    // Signature lines (left and right)
    const tableLeft = 40; // Add this line
    const signatureY = doc.y + 40;
    doc.fontSize(12);
    doc.text("SIRE TECH: ________________________", tableLeft, signatureY, { align: "left" });
    doc.text("Client: ___________________________", 350, signatureY, { align: "left" });

    doc.end();

    // Return the full URL (not just a path)
    const protocol = req.protocol;
    const host = req.get('host');
    return `${protocol}://${host}/invoices/${fileName}`;
};

// Helper to generate a unique, sequential invoice number
export const generateInvoiceNumber = async () => {
    // Find the latest invoice by invoiceNo (descending)
    const lastInvoice = await Invoice.findOne({})
        .sort({ createdAt: -1 }) // or .sort({ invoiceNo: -1 }) if invoiceNo is numeric
        .lean();

    let nextNumber = 1;
    if (lastInvoice && lastInvoice.invoiceNo) {
        // Extract the numeric part (assumes format "INV-00001")
        const match = lastInvoice.invoiceNo.match(/INV-(\d+)/);
        if (match) {
            nextNumber = parseInt(match[1], 10) + 1;
        }
    }
    // Pad with leading zeros
    const padded = String(nextNumber).padStart(5, "0");
    return `INV-${padded}`;
};


export const createInvoice = async (req, res, next) => {

    try 
    {
        if (!req.user.isAdmin) 
        {
            return next(errorHandler(403, "Only admin can create invoices"));
        }

        const { projectId, items, description, clientId } = req.body;
        
        const invoiceNo = await generateInvoiceNumber();

        if (!projectId || !items || !description || !clientId) 
        {
            return next(errorHandler(400, "Missing required fields"));
        }

        // Calculate subtotal, vat, total
        const subtotal = items.reduce((sum, item) => sum + (item.qty * item.rate), 0);

        const vat = +(subtotal * 0.05).toFixed(2);

        const total = +(subtotal + vat).toFixed(2);

        // The balance is initially the total
        const balance = total;

        // Create the invoice (createdAt will be set automatically)
        const invoice = new Invoice({
            invoiceNo,
            projectId,
            clientId,
            items,
            description,
            balance,
            // status will default to "Unpaid"
        });

        await invoice.save(); // Save first, so all fields are set
        const issueDate = invoice.createdAt;
        const dueDate = new Date(new Date(issueDate).getTime() + 14 * 24 * 60 * 60 * 1000);
        const pdfUrl = await generateInvoicePDF(invoice, req, subtotal, vat, total, issueDate, dueDate);


        // Update the invoice with the PDF URL
        invoice.url = pdfUrl;

        await invoice.save();

        res.status(201).json({
            success: true,
            message: "Invoice created and PDF generated",
            invoice: {
                ...invoice.toObject(),
                issueDate,
                dueDate,
                subtotal,
                vat,
                total
            }
        });

    } 
    catch (error)
    {

        next(error);
    }
};

// GET SINGLE INVOICE
export const getInvoice = async (req, res, next) => {

    const { invoiceId } = req.params;

    try 
    {
        const invoice = await Invoice.findById(invoiceId);

        if (!invoice) 
        {
            return next(errorHandler(404, "Invoice not found"));
        }

        // Calculate subtotal, vat, total
        const subtotal = invoice.items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
        const vat = +(subtotal * 0.05).toFixed(2);
        const total = +(subtotal + vat).toFixed(2);

        // Use createdAt as issueDate, and dueDate as 14 days after
        const issueDate = invoice.createdAt;

        const dueDate = new Date(new Date(issueDate).getTime() + 14 * 24 * 60 * 60 * 1000);

        res.status(200).json({
            success: true,
            invoice: {
                ...invoice.toObject(),
                issueDate,
                dueDate,
                subtotal,
                vat,
                total
            }
        });

    } catch (error) {
        next(error);
    }
};

// GET ALL INVOICES
export const getInvoices = async (req, res, next) => {

    try 
    {
        // Sort by createdAt descending (newest first)
        const invoices = await Invoice.find().sort({ createdAt: -1 });

        const result = invoices.map(inv => {

            const subtotal = inv.items.reduce((sum, item) => sum + (item.qty * item.rate), 0);

            const vat = +(subtotal * 0.05).toFixed(2);

            const total = +(subtotal + vat).toFixed(2);


            // Use createdAt as issueDate, and dueDate as 14 days after
            const issueDate = inv.createdAt;

            const dueDate = new Date(new Date(issueDate).getTime() + 14 * 24 * 60 * 60 * 1000);

            return {
                ...inv.toObject(),
                issueDate,
                dueDate,
                subtotal,
                vat,
                total
            };

        });

        res.status(200).json({ success: true, invoices: result });

    } 
    catch (error) 
    {
        next(error);
    }

};

// UPDATE INVOICE
export const updateInvoice = async (req, res, next) => {

    if (!req.user.isAdmin) 
    {
        return next(errorHandler(403, "You are not allowed to update the invoice"));
    }

    if (!req.body) {
        return next(errorHandler(400, "No data provided in request body"));
    }

    const { invoiceId } = req.params;

    try 
    {
        let invoice = await Invoice.findById(invoiceId);

        if (!invoice)
        {
            return next(errorHandler(404, "Invoice not found"));
        }

        // Allowed statuses (sync with model)
        const allowedStatuses = ["Unpaid", "PartiallyPaid", "Paid", "Void"];

        const updateData = {};

        // Only update fields if provided
        if (req.body.status) 
        {
            if (!allowedStatuses.includes(req.body.status)) 
            {
                return next(errorHandler(400, "Invalid status value"));
            }

            updateData.status = req.body.status;

        }

        if (req.body.description) updateData.description = req.body.description;

        if (req.body.items) updateData.items = req.body.items;

        // Update the document
        invoice = await Invoice.findByIdAndUpdate(
            invoiceId,
            { $set: updateData },
            { new: true }
        );

        // Recalculate subtotal, vat, total
        const items = req.body.items || invoice.items;
        const subtotal = items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
        const vat = +(subtotal * 0.05).toFixed(2);
        const total = +(subtotal + vat).toFixed(2);

        // Regenerate PDF and update URL
        const issueDate = invoice.createdAt;
        const dueDate = new Date(new Date(issueDate).getTime() + 14 * 24 * 60 * 60 * 1000);

        const pdfUrl = await generateInvoicePDF(
            { ...invoice.toObject(), items },
            req,
            subtotal,
            vat,
            total,
            issueDate,
            dueDate
        );

        invoice.url = pdfUrl;
        invoice.balance = total; // Optionally update balance if items changed
        await invoice.save();

        res.status(200).json({
            success: true,
            invoice: {
                ...invoice.toObject(),
                issueDate,
                dueDate,
                subtotal,
                vat,
                total
            }
        });

    } catch (error) {
        next(error);
    }
};

// DELETE INVOICE
export const deleteInvoice = async (req, res, next) => {

    if (!req.user.isAdmin) 
    {
        return next(errorHandler(403, "You are not allowed to delete the invoice"));
    }

    const { invoiceId } = req.params;

    try 
    {
        const invoice = await Invoice.findById(invoiceId);

        if (!invoice) 
        {
            return next(errorHandler(404, "Invoice not found"));
        }

        await Invoice.findByIdAndDelete(invoiceId);

        res.status(200).json({ success: true, message: `Invoice deleted successfully` });

    } 
    catch (error) 
    {
        next(error);
    }
    
};

export const sendInvoiceEmail = async (req, res, next) => {

    // Admin check
    if (!req.user.isAdmin) 
    {
        return next(errorHandler(403, "Only admin can send invoice emails"));
    }

    const { invoiceId } = req.params;

    try 
    {
        // Find the invoice
        const invoice = await Invoice.findById(invoiceId);

        if (!invoice) {
            return next(errorHandler(404, "Invoice not found"));
        }

        // Find the client
        const client = await Client.findById(invoice.clientId);

        if (!client) {
            return next(errorHandler(404, "Client not found"));
        }

        // Log the email address
        console.log("Sending invoice to:", client.email);

        // Compose the email with HTML
        const mailOptions = {
            from: "SIRE TECH SUPPORT <" + process.env.AUTH_USER + ">",
            to: client.email,
            subject: "Your Invoice from SIRE TECH",
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
                        We are excited to send you your invoice for the requested project.<br>
                        Please review the invoice carefully and let us know if you have any questions.
                      </p>
                      <div style="background: #FFF3F3; border-left: 5px solid #D80000; padding: 18px 20px; border-radius: 8px; margin-bottom: 18px;">
                        <p style="margin: 0; color: #A30000; font-size: 1.08em;">
                          <strong>To view and pay your invoice, please click the button below:</strong>
                        </p>
                        <div style="text-align: center; margin: 18px 0;">
                          <a href="${invoice.url}" style="background: #CC0000; color: #fff; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-size: 1.1em; font-weight: bold; letter-spacing: 1px; display: inline-block;">
                            📄 View Invoice
                          </a>
                        </div>
                        <p style="margin: 0; color: #660000; font-size: 0.98em;">
                          If the button above does not work, copy and paste this link into your browser:<br>
                          <span style="color: #D80000; word-break: break-all;">${invoice.url}</span>
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
            if (error) {
                console.error("Nodemailer error:", error);
                return next(errorHandler(500, "Failed to send email: " + error.message));
            } else {
                console.log("Email sent: " + info.response);
                res.status(200).json({ success: true, message: "Invoice email sent to client" });
            }
        });

    } catch (error) {
        next(error);
    }
};
