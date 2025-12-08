import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { Response } from "express";
import ApiError from "../errors/ApiError";
import { IUser } from "../app/modules/user/user.interface";
import { parse } from 'json2csv';

export function generateUserTablePDF(users: IUser[], res: Response) {
  try {
    const fileName = `user-report-${Date.now()}.pdf`;
    const dirPath = path.join(process.cwd(), "uploads", "doc");
    const filePath = path.join(dirPath, fileName);

    // Ensure folder exists
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 40 });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // ===== HEADER =====
    doc.fontSize(24).fillColor("#333").text("User Report", { align: "center" });
    doc.moveDown(0.5);

    const today = new Date().toLocaleString();
    doc.fontSize(12).fillColor("#555").text(`Generated: ${today}`, { align: "center" });
    doc.moveDown(1.5);

    // ===== TABLE HEADER =====
    const startY = 140;

    const col = {
      sl: 40,
      name: 80,
      email: 200,
      role: 360,
      location: 450,
    };

    doc.fontSize(13).fillColor("black").text("SL", col.sl, startY);
    doc.text("Name", col.name, startY);
    doc.text("Email", col.email, startY);
    doc.text("Role", col.role, startY);
    doc.text("Location", col.location, startY);

    doc.moveTo(40, startY + 18)
      .lineTo(560, startY + 18)
      .stroke("#000");

    // ===== TABLE ROWS =====
    let y = startY + 30;

    users.forEach((u, index) => {
      const location = u.address || "N/A";
      const role = u.role || "N/A";

      doc.fontSize(11).fillColor("#333");

      doc.text(String(index + 1), col.sl, y, { width: 30 });
      doc.text(u.name, col.name, y, { width: 110 });
      doc.text(u.email, col.email, y, { width: 150 });
      doc.text(role, col.role, y, { width: 80 });
      doc.text(location, col.location, y, { width: 120 });

      y += 25;

      // New page if table exceeds the height
      if (y > 750) {
        doc.addPage();
        y = 50;
      }
    });

    doc.end();

    writeStream.on("finish", () => {
      return res.download(filePath);
    });

    postDeleteFile(filePath);

    writeStream.on("error", () => {
      throw new ApiError(400, "Failed to write PDF");
    });

  } catch (err) {
    console.log(err);
    throw new ApiError(500, "Something went wrong while generating PDF");
  }
}




export function exportUsersToCSV(users: IUser[],res:Response) {
  // Add Sl No manually
  const usersWithSlNo = users.map((user, index) => ({
    'Sl No': index + 1,
    Name: user.name || '',
    Email: user.email || '',
    Location: user.address || '',
    Role: user.role || '',
    Phone: user.phone || ''
  }));

  // Fields order for CSV
  const fields = ['Sl No', 'Name', 'Email', 'Location', 'Role', 'Phone'];

  try {
    const csv = parse(usersWithSlNo, { fields });

    const outputPath = path.join(process.cwd(), 'uploads', 'doc',`users-${Date.now()}.csv`);
    fs.writeFileSync(outputPath, csv);
    postDeleteFile(outputPath);
    return res.download(outputPath);
  } catch (err) {
    console.error('Error exporting CSV:', err);
  }
}


interface ISubscription {
  user: {
    name: string;
    email: string;
  };
  package: {
    name: string;
    price: number;
  };
  createdAt: string;
  status: string;
  txId: string;
}

// ===== PDF Export =====
export function generateSubscriptionPDF(subscriptions: any[], res: Response) {
  try {
    const fileName = `subscription-report-${Date.now()}.pdf`;
    const dirPath = path.join(process.cwd(), "uploads", "doc");
    const filePath = path.join(dirPath, fileName);
    
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    const doc = new PDFDocument({ 
      margin: 0,
      size: 'A4',
      bufferPages: true
    });
    
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);
    
    // Header with background
    doc.rect(0, 0, doc.page.width, 80).fill('#4A5568');
    
    doc.fontSize(26)
       .fillColor('#FFFFFF')
       .font('Helvetica-Bold')
       .text("Subscription Report", 0, 20, { align: "center", width: doc.page.width });
    
    const today = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    doc.fontSize(10)
       .fillColor('#E2E8F0')
       .font('Helvetica')
       .text(`Generated: ${today}`, 0, 52, { align: "center", width: doc.page.width });
    
    // Compact table setup
    const tableTop = 90;
    const rowHeight = 30;
    const headerHeight = 35;
    
    // Optimized columns - edge to edge
    const columns = [
      { key: 'sl', x: 10, width: 35, header: 'SL' },
      { key: 'username', x: 50, width: 90, header: 'Username' },
      { key: 'email', x: 145, width: 145, header: 'Email' },
      { key: 'package', x: 295, width: 85, header: 'Package' },
      { key: 'price', x: 385, width: 50, header: 'Price' },
      { key: 'date', x: 440, width: 75, header: 'Date' },
      { key: 'status', x: 520, width: 65, header: 'Status' }
    ];
    
    // Draw table header
    doc.rect(0, tableTop, doc.page.width, headerHeight)
       .fill('#2D3748');
    
    doc.fontSize(10)
       .fillColor('#FFFFFF')
       .font('Helvetica-Bold');
    
    columns.forEach(col => {
      doc.text(col.header, col.x, tableTop + 12, {
        width: col.width,
        align: 'left',
        lineBreak: false,
        continued: false
      });
    });
    
    // Table rows
    let currentY = tableTop + headerHeight;
    
    subscriptions.forEach((s, index) => {
      // Check for page break
      if (currentY > doc.page.height - 80) {
        doc.addPage();
        currentY = 70;
        
        // Redraw header
        doc.rect(0, currentY, doc.page.width, headerHeight)
           .fill('#2D3748');
        
        doc.fontSize(10)
           .fillColor('#FFFFFF')
           .font('Helvetica-Bold');
        
        columns.forEach(col => {
          doc.text(col.header, col.x, currentY + 12, {
            width: col.width,
            align: 'left',
            lineBreak: false,
            continued: false
          });
        });
        
        currentY += headerHeight;
      }
      
      // Alternating row background
      if (index % 2 === 0) {
        doc.rect(0, currentY, doc.page.width, rowHeight)
           .fill('#F7FAFC');
      }
      
      doc.fontSize(9)
         .fillColor('#2D3748')
         .font('Helvetica');
      
      const textY = currentY + 11;
      
      // SL
      doc.text(String(index + 1), columns[0].x, textY, {
        width: columns[0].width,
        align: 'left',
        lineBreak: false,
        continued: false
      });
      
      // Username
      const username = s.user?.name || "N/A";
      const truncatedUsername = username.length > 13 ? username.substring(0, 13) + '...' : username;
      doc.text(truncatedUsername, columns[1].x, textY, {
        width: columns[1].width,
        align: 'left',
        lineBreak: false,
        continued: false
      });
      
      // Email
      const email = s.user?.email || "N/A";
      const truncatedEmail = email.length > 20 ? email.substring(0, 20) + '...' : email;
      doc.text(truncatedEmail, columns[2].x, textY, {
        width: columns[2].width,
        align: 'left',
        lineBreak: false,
        continued: false
      });
      
      // Package
      const packageName = s?.name || "N/A";
      const truncatedPackage = packageName.length > 12 ? packageName.substring(0, 12) + '...' : packageName;
      doc.text(truncatedPackage, columns[3].x, textY, {
        width: columns[3].width,
        align: 'left',
        lineBreak: false,
        continued: false
      });
      
      // Price
      const packagePrice = s?.price != null ? `${s.price}` : "N/A";
      doc.text(packagePrice, columns[4].x, textY, {
        width: columns[4].width,
        align: 'left',
        lineBreak: false,
        continued: false
      });
      
      // Date
      const formattedDate = new Date(s.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      doc.text(formattedDate, columns[5].x, textY, {
        width: columns[5].width,
        align: 'left',
        lineBreak: false,
        continued: false
      });
      
      // Status
      const status = s.status || "N/A";
      const statusColor = status.toLowerCase() === 'active' ? '#48BB78' : 
                         status.toLowerCase() === 'inactive' ? '#F56565' : '#A0AEC0';
      
      doc.fillColor(statusColor)
         .font('Helvetica-Bold');
      
      doc.text(status, columns[6].x, textY, {
        width: columns[6].width,
        align: 'left',
        lineBreak: false,
        continued: false
      });
      
      // Row separator
      doc.strokeColor('#E2E8F0')
         .lineWidth(0.5)
         .moveTo(0, currentY + rowHeight)
         .lineTo(doc.page.width, currentY + rowHeight)
         .stroke();
      
      currentY += rowHeight;
    });
    
    // Add page numbers
    const pageCount = doc.bufferedPageRange();
    for (let i = 0; i < pageCount.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8)
         .fillColor('#718096')
         .text(
           `Page ${i + 1} of ${pageCount.count}`,
           0,
           doc.page.height - 30,
           { align: 'center', width: doc.page.width }
         );
    }
    
    doc.end();
    
    writeStream.on("finish", () => res.download(filePath));
    postDeleteFile(filePath);
    writeStream.on("error", () => { 
      throw new ApiError(400, "Failed to write PDF"); 
    });
    
  } catch (err) {
    console.error(err);
    throw new ApiError(500, "Something went wrong while generating PDF");
  }
}

// ===== CSV Export =====
export function exportSubscriptionsToCSV(subscriptions: ISubscription[], res: Response) {
  const subscriptionsWithSlNo = subscriptions.map((s, index) => ({
    'Sl No': index + 1,
    Username: s.user.name || '',
    Email: s.user.email || '',
    'Package Name': s.package.name || '',
    Price: s.package.price || 0,
    'Subscription Date': new Date(s.createdAt).toLocaleDateString(),
    Status: s.status || '',
    TxId: s.txId || ''
  }));

  const fields = ['Sl No', 'Username', 'Email', 'Package Name', 'Price', 'Subscription Date', 'Status', 'TxId'];

  try {
    const csv = parse(subscriptionsWithSlNo, { fields });
    const outputPath = path.join(process.cwd(), 'uploads', 'doc', `subscriptions-${Date.now()}.csv`);
    fs.writeFileSync(outputPath, csv);
    postDeleteFile(outputPath);
    return res.download(outputPath);
  } catch (err) {
    console.error('Error exporting CSV:', err);
    throw new ApiError(500, "Failed to export CSV");
  }
}


export function generateOrganizationTablePDF(organizations: any[], res: Response) {
  try {
    const fileName = `organization-report-${Date.now()}.pdf`;
    const dirPath = path.join(process.cwd(), "uploads", "doc");
    const filePath = path.join(dirPath, fileName);

    // Ensure folder exists
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 40 });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // ===== HEADER =====
    doc.fontSize(24).fillColor("#333").text("Organization Report", { align: "center" });
    doc.moveDown(0.5);

    const today = new Date().toLocaleString();
    doc.fontSize(12).fillColor("#555").text(`Generated: ${today}`, { align: "center" });
    doc.moveDown(1.5);

    // ===== TABLE HEADER =====
    const startY = 140;

    const col = {
      sl: 40,
      name: 70,
      service: 180,
      startDate: 260,
      endDate: 340,
      pricing: 420,
      status: 500,
    };

    doc.fontSize(11).fillColor("black").text("SL", col.sl, startY);
    doc.text("Organization", col.name, startY);
    doc.text("Service Type", col.service, startY);
    doc.text("Start Date", col.startDate, startY);
    doc.text("End Date", col.endDate, startY);
    doc.text("Pricing", col.pricing, startY);
    doc.text("Status", col.status, startY);

    doc.moveTo(40, startY + 18)
      .lineTo(560, startY + 18)
      .stroke("#000");

    // ===== TABLE ROWS =====
    let y = startY + 30;

    organizations.forEach((org, index) => {
      const startDate = org.start_date 
        ? new Date(org.start_date).toLocaleDateString() 
        : "N/A";
      const endDate = org.end_date 
        ? new Date(org.end_date).toLocaleDateString() 
        : "N/A";
      const pricing = org.pricing || "N/A";
      const status = org.status || "N/A";

      doc.fontSize(10).fillColor("#333");

      doc.text(String(index + 1), col.sl, y, { width: 25 });
      doc.text(org.organization_name, col.name, y, { width: 100 });
      doc.text(org.service_type, col.service, y, { width: 70 });
      doc.text(startDate, col.startDate, y, { width: 70 });
      doc.text(endDate, col.endDate, y, { width: 70 });
      doc.text(pricing, col.pricing, y, { width: 70 });
      doc.text(status, col.status, y, { width: 50 });

      y += 25;

      // New page if table exceeds the height
      if (y > 750) {
        doc.addPage();
        y = 50;
      }
    });

    doc.end();

    writeStream.on("finish", () => {
      return res.download(filePath);
    });

    postDeleteFile(filePath);

    writeStream.on("error", () => {
      throw new ApiError(400, "Failed to write PDF");
    });

  } catch (err) {
    console.log(err);
    throw new ApiError(500, "Something went wrong while generating PDF");
  }
}

export function exportOrganizationsToCSV(organizations: any[], res: Response) {
  // Add Sl No and format data
  const organizationsWithSlNo = organizations.map((org, index) => ({
    'Sl No': index + 1,
    'Organization Name': org.organization_name || '',
    'Service Type': org.service_type || '',
    'Start Date': org.start_date 
      ? new Date(org.start_date).toLocaleDateString() 
      : '',
    'End Date': org.end_date 
      ? new Date(org.end_date).toLocaleDateString() 
      : '',
    'Pricing': org.pricing || '',
    'Status': org.status || ''
  }));

  // Fields order for CSV
  const fields = [
    'Sl No', 
    'Organization Name', 
    'Service Type', 
    'Start Date', 
    'End Date', 
    'Pricing', 
    'Status'
  ];

  try {
    const csv = parse(organizationsWithSlNo, { fields });

    const outputPath = path.join(
      process.cwd(), 
      'uploads', 
      'doc',
      `organizations-${Date.now()}.csv`
    );
    fs.writeFileSync(outputPath, csv);
    postDeleteFile(outputPath);
    return res.download(outputPath);
  } catch (err) {
    console.error('Error exporting CSV:', err);
    throw new ApiError(500, "Something went wrong while exporting CSV");
  }
}


export function generateJobTablePDF(jobs: any[], res: Response) {
  try {
    const fileName = `job-report-${Date.now()}.pdf`;
    const dirPath = path.join(process.cwd(), "uploads", "doc");
    const filePath = path.join(dirPath, fileName);

    // Ensure folder exists
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 40 });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // ===== HEADER =====
    doc.fontSize(24).fillColor("#333").text("Job Report", { align: "center" });
    doc.moveDown(0.5);

    const today = new Date().toLocaleString();
    doc.fontSize(12).fillColor("#555").text(`Generated: ${today}`, { align: "center" });
    doc.moveDown(1.5);

    // ===== TABLE HEADER =====
    const startY = 140;

    const col = {
      sl: 40,
      company: 70,
      email: 180,
      jobType: 300,
      jobLevel: 370,
      deadline: 460,
      status: 520,
    };

    doc.fontSize(11).fillColor("black").text("SL", col.sl, startY);
    doc.text("Company", col.company, startY);
    doc.text("Email", col.email, startY);
    doc.text("Job Type", col.jobType, startY);
    doc.text("Job Level", col.jobLevel, startY);
    doc.text("Deadline", col.deadline, startY);
    doc.text("Status", col.status, startY);

    doc.moveTo(40, startY + 18)
      .lineTo(560, startY + 18)
      .stroke("#000");

    // ===== TABLE ROWS =====
    let y = startY + 30;

    jobs.forEach((job, index) => {
      const companyName = job.recruiter?.name || "N/A";
      const email = job.recruiter?.email || "N/A";
      const jobType = job.job_type || "N/A";
      const jobLevel = job.job_level || "N/A";
      const deadline = job.deadline 
        ? new Date(job.deadline).toLocaleDateString() 
        : "N/A";
      const status = job.status || "N/A";

      doc.fontSize(9).fillColor("#333");

      doc.text(String(index + 1), col.sl, y, { width: 25 });
      doc.text(companyName, col.company, y, { width: 100 });
      doc.text(email, col.email, y, { width: 110 });
      doc.text(jobType, col.jobType, y, { width: 60 });
      doc.text(jobLevel, col.jobLevel, y, { width: 80 });
      doc.text(deadline, col.deadline, y, { width: 50 });
      doc.text(status, col.status, y, { width: 40 });

      y += 25;

      // New page if table exceeds the height
      if (y > 750) {
        doc.addPage();
        y = 50;
      }
    });

    doc.end();

    writeStream.on("finish", () => {
      return res.download(filePath);
    });

    postDeleteFile(filePath);

    writeStream.on("error", () => {
      throw new ApiError(400, "Failed to write PDF");
    });

  } catch (err) {
    console.log(err);
    throw new ApiError(500, "Something went wrong while generating PDF");
  }
}

export function exportJobsToCSV(jobs: any[], res: Response) {
  // Add Sl No and format data
  const jobsWithSlNo = jobs.map((job, index) => ({
    'Sl No': index + 1,
    'Company Name': job.recruiter?.name || '',
    'Email': job.recruiter?.email || '',
    'Job Type': job.job_type || '',
    'Job Level': job.job_level || '',
    'Deadline': job.deadline 
      ? new Date(job.deadline).toLocaleDateString() 
      : '',
    'Status': job.status || ''
  }));

  // Fields order for CSV
  const fields = [
    'Sl No', 
    'Company Name', 
    'Email', 
    'Job Type', 
    'Job Level', 
    'Deadline', 
    'Status'
  ];

  try {
    const csv = parse(jobsWithSlNo, { fields });

    const outputPath = path.join(
      process.cwd(), 
      'uploads', 
      'doc',
      `jobs-${Date.now()}.csv`
    );
    fs.writeFileSync(outputPath, csv);
    postDeleteFile(outputPath);
    return res.download(outputPath);
  } catch (err) {
    console.error('Error exporting CSV:', err);
    throw new ApiError(500, "Something went wrong while exporting CSV");
  }
}

export function generateSupportTablePDF(tickets: any[], res: Response) {
  try {
    const fileName = `support-report-${Date.now()}.pdf`;
    const dirPath = path.join(process.cwd(), "uploads", "doc");
    const filePath = path.join(dirPath, fileName);

    // Ensure folder exists
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 40 });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // ===== HEADER =====
    doc.fontSize(24).fillColor("#333").text("Support Ticket Report", { align: "center" });
    doc.moveDown(0.5);

    const today = new Date().toLocaleString();
    doc.fontSize(12).fillColor("#555").text(`Generated: ${today}`, { align: "center" });
    doc.moveDown(1.5);

    // ===== TABLE HEADER =====
    const startY = 140;

    const col = {
      sl: 40,
      username: 70,
      email: 170,
      title: 290,
      date: 410,
      status: 500,
    };

    doc.fontSize(11).fillColor("black").text("SL", col.sl, startY);
    doc.text("Username", col.username, startY);
    doc.text("Email", col.email, startY);
    doc.text("Issue Title", col.title, startY);
    doc.text("Issue Date", col.date, startY);
    doc.text("Status", col.status, startY);

    doc.moveTo(40, startY + 18)
      .lineTo(560, startY + 18)
      .stroke("#000");

    // ===== TABLE ROWS =====
    let y = startY + 30;

    tickets.forEach((ticket, index) => {
      const username = ticket.user?.name || "N/A";
      const email = ticket.user?.email || "N/A";
      const title = ticket.reason || "N/A";
      const issueDate = ticket.createdAt 
        ? new Date(ticket.createdAt).toLocaleDateString() 
        : "N/A";
      const status = ticket.status || "N/A";

      doc.fontSize(10).fillColor("#333");

      doc.text(String(index + 1), col.sl, y, { width: 25 });
      doc.text(username, col.username, y, { width: 90 });
      doc.text(email, col.email, y, { width: 110 });
      doc.text(title, col.title, y, { width: 110 });
      doc.text(issueDate, col.date, y, { width: 80 });
      doc.text(status, col.status, y, { width: 50 });

      y += 25;

      // New page if table exceeds the height
      if (y > 750) {
        doc.addPage();
        y = 50;
      }
    });

    doc.end();

    writeStream.on("finish", () => {
      return res.download(filePath);
    });

    postDeleteFile(filePath);

    writeStream.on("error", () => {
      throw new ApiError(400, "Failed to write PDF");
    });

  } catch (err) {
    console.log(err);
    throw new ApiError(500, "Something went wrong while generating PDF");
  }
}

export function exportSupportToCSV(tickets: any[], res: Response) {
  // Add Sl No and format data
  const ticketsWithSlNo = tickets.map((ticket, index) => ({
    'Sl No': index + 1,
    'Username': ticket.user?.name || '',
    'Email': ticket.user?.email || '',
    'Issue Title': ticket.reason || '',
    'Issue Date': ticket.createdAt 
      ? new Date(ticket.createdAt).toLocaleDateString() 
      : '',
    'Status': ticket.status || ''
  }));

  // Fields order for CSV
  const fields = [
    'Sl No', 
    'Username', 
    'Email', 
    'Issue Title', 
    'Issue Date', 
    'Status'
  ];

  try {
    const csv = parse(ticketsWithSlNo, { fields });

    const outputPath = path.join(
      process.cwd(), 
      'uploads', 
      'doc',
      `support-tickets-${Date.now()}.csv`
    );
    fs.writeFileSync(outputPath, csv);
    postDeleteFile(outputPath);
    return res.download(outputPath);
  } catch (err) {
    console.error('Error exporting CSV:', err);
    throw new ApiError(500, "Something went wrong while exporting CSV");
  }
}

const postDeleteFile = async (filePath: string) => {
  try {
    await Promise.all([
        setTimeout(() => fs.unlinkSync(filePath), 5000),
    ])
    console.log('File deleted successfully');
  } catch (err) {
    console.error('Error deleting file:', err);
  }
}




