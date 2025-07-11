
import Quatation from "../model/quatationModel.js";
import { errorHandler } from "../utils/error.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import Client from "../model/clientModel.js";
import Project from "../model/projectModel.js";


// Helper to generate PDF and return the file URL
const generateQuotationPDF = async (quotation, req) => {
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
    doc.fontSize(10).text(`Issue Date: ${quotation.issueDate}`);
    doc.text(`Expiry Date: ${quotation.expiryDate}`);
    doc.moveDown();

    // Description
    if (quotation.description) {
        doc.fontSize(12).text(`${quotation.description}`);
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
        { label: "Subtotal", value: quotation.subtotal },
        { label: "VAT", value: quotation.vat },
        { label: "Total", value: quotation.total }
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


export const createQuotation = async (req, res, next) => {
    try {
        if (!req.user.isAdmin) {
            return next(errorHandler(403, "Only admin can create quotations"));
        }

        // Required fields
        const { projectId, issueDate, expiryDate, items, subtotal, vat, total, status ,description ,clientId} = req.body;

        if (!projectId || !issueDate || !expiryDate || !items || !subtotal || !vat || !total) {
            return next(errorHandler(400, "Missing required fields"));
        }

        // Create the quotation (without URL first)
        const quotation = new Quatation({
            projectId,
            clientId,
            issueDate,
            expiryDate,
            items,
            subtotal,
            vat,
            total,
            status,
            description
        });

        await quotation.save();

        // Generate PDF and get URL
        const pdfUrl = await generateQuotationPDF(quotation, req);

        // Update the quotation with the PDF URL
        quotation.url = pdfUrl;
        await quotation.save();

        res.status(201).json({
            success: true,
            message: "Quotation created and PDF generated",
            quotation
        });
    } catch (error) {
        next(error);
    }
};


export const getQuatation = async (req,res,next) => {

    const {quatationId} = req.params

    try
    {
        const quatation = await Quatation.findById(quatationId)

        if(!quatation)
        {
            return next(errorHandler(404,"Quatation not found "))
        }

        res.status(200).json({success:true , quatation})

    }
    catch(error)
    {
        next(error)
    }

}


export const getQuatations = async (req,res,next) => {

    try
    {
        const quatations = await Quatation.find()

        res.status(200).json({success:true , quatations})

    }
    catch(error)
    {
        next(error)
    }

}


export const updateQuatation = async (req,res,next) => {

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

        const updatedQuatation = await Quatation.findByIdAndUpdate(
            quatationId,
            {
                $set:{
                    
                }
            }
        )

    }
    catch(error)
    {
        next(error)
    }

}


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