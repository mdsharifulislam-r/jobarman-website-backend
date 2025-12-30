import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { Response } from "express";
import ApiError from "../errors/ApiError";
import { IUser } from "../app/modules/user/user.interface";
import { parse } from 'json2csv';

// ────────────────────────────────────────────────────────────────────────────────
// Shared file deletion utility (5s delay)
// ────────────────────────────────────────────────────────────────────────────────
const postDeleteFile = (filePath: string) => {
  setTimeout(() => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted: ${filePath}`);
      }
    } catch (err) {
      console.error(`Delete failed ${filePath}:`, err);
    }
  }, 5000);
};

// ────────────────────────────────────────────────────────────────────────────────
// USER REPORT - PDF
// ────────────────────────────────────────────────────────────────────────────────
export function generateUserTablePDF(users: IUser[], res: Response) {
  try {
    const fileName = `user-report-${Date.now()}.pdf`;
    const dirPath = path.join(process.cwd(), "uploads", "doc");
    const filePath = path.join(dirPath, fileName);

    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

    const doc = new PDFDocument({ margin: 40 });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Header
    doc.fontSize(24).fillColor("#333").text("User Report", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor("#555").text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
    doc.moveDown(1.5);

    const startY = 140;
    const columns = {
      sl: 40,
      name: 80,
      email: 200,
      role: 360,
      location: 450,
    };

    let y = startY;

    const drawHeader = () => {
      doc.fontSize(13).fillColor("black");
      doc.text("SL", columns.sl, y);
      doc.text("Name", columns.name, y);
      doc.text("Email", columns.email, y);
      doc.text("Role", columns.role, y);
      doc.text("Location", columns.location, y);

      doc.moveTo(40, y + 18).lineTo(560, y + 18).stroke("#000");
      y += 30;
    };

    drawHeader();

    users.forEach((user, index) => {
      if (y > 720) {
        doc.addPage();
        y = 60;
        drawHeader();
      }

      const location = user.address || "N/A";
      const role = user.role || "N/A";

      doc.fontSize(11).fillColor("#333");

      doc.text(String(index + 1), columns.sl, y, { width: 30 });
      doc.text(user.name || "", columns.name, y, { width: 110 });
      doc.text(user.email || "", columns.email, y, { width: 150 });
      doc.text(role, columns.role, y, { width: 80 });
      doc.text(location, columns.location, y, { width: 120 });

      y += 25;
    });

    doc.end();

    writeStream.on("finish", () => res.download(filePath));
    postDeleteFile(filePath);

    writeStream.on("error", () => { throw new ApiError(400, "Failed to write PDF"); });
  } catch (err) {
    console.error(err);
    throw new ApiError(500, "Error generating user PDF");
  }
}

// ────────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTION REPORT - PDF
// ────────────────────────────────────────────────────────────────────────────────
function drawSubscriptionHeader(doc: PDFKit.PDFDocument): { y: number; columns: any[] } {
  const tableTop = 90;
  const headerHeight = 35;

  doc.rect(0, tableTop, doc.page.width, headerHeight).fill('#2D3748');

  doc.fontSize(10).fillColor('#FFFFFF').font('Helvetica-Bold');

  const columns = [
    { x: 10,  width: 35,  label: 'SL'      },
    { x: 50,  width: 90,  label: 'Username' },
    { x: 145, width: 145, label: 'Email'    },
    { x: 295, width: 85,  label: 'Package'  },
    { x: 385, width: 50,  label: 'Price'    },
    { x: 440, width: 75,  label: 'Date'     },
    { x: 520, width: 65,  label: 'Status'   },
  ];

  columns.forEach(col => {
    doc.text(col.label, col.x, tableTop + 12, {
      width: col.width,
      align: 'left',
      lineBreak: false,
      continued: false
    });
  });

  return { y: tableTop + headerHeight, columns };
}

export function generateSubscriptionPDF(subscriptions: any[], res: Response) {
  try {
    const fileName = `subscription-report-${Date.now()}.pdf`;
    const dirPath = path.join(process.cwd(), "uploads", "doc");
    const filePath = path.join(dirPath, fileName);

    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

    const doc = new PDFDocument({ margin: 0, size: 'A4', bufferPages: true });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Document header
    doc.rect(0, 0, doc.page.width, 80).fill('#4A5568');
    doc.fontSize(26)
       .fillColor('#FFFFFF')
       .font('Helvetica-Bold')
       .text("Subscription Report", 0, 20, { align: "center", width: doc.page.width });

    doc.fontSize(10)
       .fillColor('#E2E8F0')
       .font('Helvetica')
       .text(`Generated: ${new Date().toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 
             0, 52, { align: "center", width: doc.page.width });

    let { y: currentY, columns } = drawSubscriptionHeader(doc);
    const rowHeight = 30;
    const bottomMargin = 80;

    subscriptions.forEach((sub, index) => {
      if (currentY + rowHeight > doc.page.height - bottomMargin) {
        doc.addPage();
        ({ y: currentY, columns } = drawSubscriptionHeader(doc));
      }

      if (index % 2 === 0) {
        doc.rect(0, currentY, doc.page.width, rowHeight).fill('#F7FAFC');
      }

      doc.fontSize(9).fillColor('#2D3748').font('Helvetica');
      const textY = currentY + 11;

      doc.text(String(index + 1), columns[0].x, textY, { width: columns[0].width, align: 'left' });

      const username = sub.user?.name || "N/A";
      const truncUser = username.length > 13 ? username.slice(0, 13) + '...' : username;
      doc.text(truncUser, columns[1].x, textY, { width: columns[1].width, align: 'left' });

      const email = sub.user?.email || "N/A";
      const truncEmail = email.length > 20 ? email.slice(0, 20) + '...' : email;
      doc.text(truncEmail, columns[2].x, textY, { width: columns[2].width, align: 'left' });

      const pkgName = sub.package?.name || "N/A";
      const truncPkg = pkgName.length > 12 ? pkgName.slice(0, 12) + '...' : pkgName;
      doc.text(truncPkg, columns[3].x, textY, { width: columns[3].width, align: 'left' });

      const price = sub.package?.price != null ? String(sub.package.price) : "N/A";
      doc.text(price, columns[4].x, textY, { width: columns[4].width, align: 'left' });

      const date = new Date(sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      doc.text(date, columns[5].x, textY, { width: columns[5].width, align: 'left' });

      const status = sub.status || "N/A";
      const color = status.toLowerCase() === 'active' ? '#48BB78' :
                    status.toLowerCase() === 'inactive' ? '#F56565' : '#A0AEC0';

      doc.fillColor(color).font('Helvetica-Bold');
      doc.text(status, columns[6].x, textY, { width: columns[6].width, align: 'left' });

      doc.fillColor('#2D3748'); // reset

      doc.strokeColor('#E2E8F0').lineWidth(0.5)
         .moveTo(0, currentY + rowHeight)
         .lineTo(doc.page.width, currentY + rowHeight)
         .stroke();

      currentY += rowHeight;
    });

    // Page numbers
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor('#718096')
         .text(`Page ${i + 1} of ${range.count}`, 0, doc.page.height - 30, { align: 'center', width: doc.page.width });
    }

    doc.end();

    writeStream.on("finish", () => res.download(filePath));
    postDeleteFile(filePath);

    writeStream.on("error", () => { throw new ApiError(400, "Failed to write PDF"); });
  } catch (err) {
    console.error(err);
    throw new ApiError(500, "Error generating subscription PDF");
  }
}

// ────────────────────────────────────────────────────────────────────────────────
// ORGANIZATION REPORT - PDF
// ────────────────────────────────────────────────────────────────────────────────
export function generateOrganizationTablePDF(organizations: any[], res: Response) {
  try {
    const fileName = `organization-report-${Date.now()}.pdf`;
    const dirPath = path.join(process.cwd(), "uploads", "doc");
    const filePath = path.join(dirPath, fileName);

    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

    const doc = new PDFDocument({ margin: 40 });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    doc.fontSize(24).fillColor("#333").text("Organization Report", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor("#555").text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
    doc.moveDown(1.5);

    const startY = 140;
    const columns = {
      sl: 40,
      name: 70,
      service: 180,
      startDate: 260,
      endDate: 340,
      pricing: 420,
      status: 500,
    };

    let y = startY;

    const drawHeader = () => {
      doc.fontSize(11).fillColor("black");
      doc.text("SL", columns.sl, y);
      doc.text("Organization", columns.name, y);
      doc.text("Service Type", columns.service, y);
      doc.text("Start Date", columns.startDate, y);
      doc.text("End Date", columns.endDate, y);
      doc.text("Pricing", columns.pricing, y);
      doc.text("Status", columns.status, y);

      doc.moveTo(40, y + 18).lineTo(560, y + 18).stroke("#000");
      y += 30;
    };

    drawHeader();

    organizations.forEach((org, index) => {
      if (y > 720) {
        doc.addPage();
        y = 60;
        drawHeader();
      }

      const startDate = org.start_date ? new Date(org.start_date).toLocaleDateString() : "N/A";
      const endDate   = org.end_date   ? new Date(org.end_date).toLocaleDateString()   : "N/A";
      const pricing   = org.pricing || "N/A";
      const status    = org.status || "N/A";

      doc.fontSize(10).fillColor("#333");

      doc.text(String(index + 1), columns.sl, y, { width: 25 });
      doc.text(org.organization_name || "", columns.name, y, { width: 100 });
      doc.text(org.service_type || "", columns.service, y, { width: 70 });
      doc.text(startDate, columns.startDate, y, { width: 70 });
      doc.text(endDate, columns.endDate, y, { width: 70 });
      doc.text(pricing, columns.pricing, y, { width: 70 });
      doc.text(status, columns.status, y, { width: 50 });

      y += 25;
    });

    doc.end();

    writeStream.on("finish", () => res.download(filePath));
    postDeleteFile(filePath);

    writeStream.on("error", () => { throw new ApiError(400, "Failed to write PDF"); });
  } catch (err) {
    console.error(err);
    throw new ApiError(500, "Error generating organization PDF");
  }
}

// ────────────────────────────────────────────────────────────────────────────────
// JOB REPORT - PDF
// ────────────────────────────────────────────────────────────────────────────────
export function generateJobTablePDF(jobs: any[], res: Response) {
  try {
    const fileName = `job-report-${Date.now()}.pdf`;
    const dirPath = path.join(process.cwd(), "uploads", "doc");
    const filePath = path.join(dirPath, fileName);

    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

    const doc = new PDFDocument({ margin: 40 });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    doc.fontSize(24).fillColor("#333").text("Job Report", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor("#555").text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
    doc.moveDown(1.5);

    const startY = 140;
    const columns = {
      sl: 40,
      company: 70,
      email: 180,
      jobType: 300,
      jobLevel: 370,
      deadline: 460,
      status: 520,
    };

    let y = startY;

    const drawHeader = () => {
      doc.fontSize(11).fillColor("black");
      doc.text("SL", columns.sl, y);
      doc.text("Company", columns.company, y);
      doc.text("Email", columns.email, y);
      doc.text("Job Type", columns.jobType, y);
      doc.text("Job Level", columns.jobLevel, y);
      doc.text("Deadline", columns.deadline, y);
      doc.text("Status", columns.status, y);

      doc.moveTo(40, y + 18).lineTo(560, y + 18).stroke("#000");
      y += 30;
    };

    drawHeader();

    jobs.forEach((job, index) => {
      if (y > 720) {
        doc.addPage();
        y = 60;
        drawHeader();
      }

      const company = job.recruiter?.name || "N/A";
      const email   = job.recruiter?.email || "N/A";
      const jobType = job.job_type || "N/A";
      const jobLevel = job.job_level || "N/A";
      const deadline = job.deadline ? new Date(job.deadline).toLocaleDateString() : "N/A";
      const status   = job.status || "N/A";

      doc.fontSize(9).fillColor("#333");

      doc.text(String(index + 1), columns.sl, y, { width: 25 });
      doc.text(company, columns.company, y, { width: 100 });
      doc.text(email, columns.email, y, { width: 110 });
      doc.text(jobType, columns.jobType, y, { width: 60 });
      doc.text(jobLevel, columns.jobLevel, y, { width: 80 });
      doc.text(deadline, columns.deadline, y, { width: 50 });
      doc.text(status, columns.status, y, { width: 40 });

      y += 25;
    });

    doc.end();

    writeStream.on("finish", () => res.download(filePath));
    postDeleteFile(filePath);

    writeStream.on("error", () => { throw new ApiError(400, "Failed to write PDF"); });
  } catch (err) {
    console.error(err);
    throw new ApiError(500, "Error generating job PDF");
  }
}

// ────────────────────────────────────────────────────────────────────────────────
// SUPPORT TICKET REPORT - PDF
// ────────────────────────────────────────────────────────────────────────────────
export function generateSupportTablePDF(tickets: any[], res: Response) {
  try {
    const fileName = `support-report-${Date.now()}.pdf`;
    const dirPath = path.join(process.cwd(), "uploads", "doc");
    const filePath = path.join(dirPath, fileName);

    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

    const doc = new PDFDocument({ margin: 40 });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    doc.fontSize(24).fillColor("#333").text("Support Ticket Report", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor("#555").text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
    doc.moveDown(1.5);

    const startY = 140;
    const columns = {
      sl: 40,
      username: 70,
      email: 170,
      title: 290,
      date: 410,
      status: 500,
    };

    let y = startY;

    const drawHeader = () => {
      doc.fontSize(11).fillColor("black");
      doc.text("SL", columns.sl, y);
      doc.text("Username", columns.username, y);
      doc.text("Email", columns.email, y);
      doc.text("Issue Title", columns.title, y);
      doc.text("Issue Date", columns.date, y);
      doc.text("Status", columns.status, y);

      doc.moveTo(40, y + 18).lineTo(560, y + 18).stroke("#000");
      y += 30;
    };

    drawHeader();

    tickets.forEach((ticket, index) => {
      if (y > 720) {
        doc.addPage();
        y = 60;
        drawHeader();
      }

      const username = ticket.user?.name || "N/A";
      const email    = ticket.user?.email || "N/A";
      const title    = ticket.reason || "N/A";
      const issueDate = ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : "N/A";
      const status   = ticket.status || "N/A";

      doc.fontSize(10).fillColor("#333");

      doc.text(String(index + 1), columns.sl, y, { width: 25 });
      doc.text(username, columns.username, y, { width: 90 });
      doc.text(email, columns.email, y, { width: 110 });
      doc.text(title, columns.title, y, { width: 110 });
      doc.text(issueDate, columns.date, y, { width: 80 });
      doc.text(status, columns.status, y, { width: 50 });

      y += 25;
    });

    doc.end();

    writeStream.on("finish", () => res.download(filePath));
    postDeleteFile(filePath);

    writeStream.on("error", () => { throw new ApiError(400, "Failed to write PDF"); });
  } catch (err) {
    console.error(err);
    throw new ApiError(500, "Error generating support PDF");
  }
}

// ────────────────────────────────────────────────────────────────────────────────
// CSV EXPORTS (improved error handling, consistent style)
// ────────────────────────────────────────────────────────────────────────────────

export function exportUsersToCSV(users: IUser[], res: Response) {
  try {
    const data = users.map((u, i) => ({
      'Sl No': i + 1,
      Name: u.name || '',
      Email: u.email || '',
      Location: u.address || '',
      Role: u.role || '',
      Phone: u.phone || ''
    }));

    const fields = ['Sl No', 'Name', 'Email', 'Location', 'Role', 'Phone'];
    const csv = parse(data, { fields });

    const outputPath = path.join(process.cwd(), 'uploads', 'doc', `users-${Date.now()}.csv`);
    fs.writeFileSync(outputPath, csv);

    postDeleteFile(outputPath);
    res.download(outputPath);
  } catch (err) {
    console.error('CSV users error:', err);
    throw new ApiError(500, "Failed to export users CSV");
  }
}

export function exportSubscriptionsToCSV(subscriptions: any[], res: Response) {
  try {
    const data = subscriptions.map((s, i) => ({
      'Sl No': i + 1,
      Username: s.user?.name || '',
      Email: s.user?.email || '',
      'Package Name': s.package?.name || '',
      Price: s.package?.price || 0,
      'Subscription Date': new Date(s.createdAt).toLocaleDateString(),
      Status: s.status || '',
      TxId: s.txId || ''
    }));

    const fields = ['Sl No', 'Username', 'Email', 'Package Name', 'Price', 'Subscription Date', 'Status', 'TxId'];
    const csv = parse(data, { fields });

    const outputPath = path.join(process.cwd(), 'uploads', 'doc', `subscriptions-${Date.now()}.csv`);
    fs.writeFileSync(outputPath, csv);

    postDeleteFile(outputPath);
    res.download(outputPath);
  } catch (err) {
    console.error('CSV subscriptions error:', err);
    throw new ApiError(500, "Failed to export subscriptions CSV");
  }
}

export function exportOrganizationsToCSV(organizations: any[], res: Response) {
  try {
    const data = organizations.map((org, i) => ({
      'Sl No': i + 1,
      'Organization Name': org.organization_name || '',
      'Service Type': org.service_type || '',
      'Start Date': org.start_date ? new Date(org.start_date).toLocaleDateString() : '',
      'End Date': org.end_date ? new Date(org.end_date).toLocaleDateString() : '',
      'Pricing': org.pricing || '',
      'Status': org.status || ''
    }));

    const fields = ['Sl No', 'Organization Name', 'Service Type', 'Start Date', 'End Date', 'Pricing', 'Status'];
    const csv = parse(data, { fields });

    const outputPath = path.join(process.cwd(), 'uploads', 'doc', `organizations-${Date.now()}.csv`);
    fs.writeFileSync(outputPath, csv);

    postDeleteFile(outputPath);
    res.download(outputPath);
  } catch (err) {
    console.error('CSV organizations error:', err);
    throw new ApiError(500, "Failed to export organizations CSV");
  }
}

export function exportJobsToCSV(jobs: any[], res: Response) {
  try {
    const data = jobs.map((job, i) => ({
      'Sl No': i + 1,
      'Company Name': job.recruiter?.name || '',
      'Email': job.recruiter?.email || '',
      'Job Type': job.job_type || '',
      'Job Level': job.job_level || '',
      'Deadline': job.deadline ? new Date(job.deadline).toLocaleDateString() : '',
      'Status': job.status || ''
    }));

    const fields = ['Sl No', 'Company Name', 'Email', 'Job Type', 'Job Level', 'Deadline', 'Status'];
    const csv = parse(data, { fields });

    const outputPath = path.join(process.cwd(), 'uploads', 'doc', `jobs-${Date.now()}.csv`);
    fs.writeFileSync(outputPath, csv);

    postDeleteFile(outputPath);
    res.download(outputPath);
  } catch (err) {
    console.error('CSV jobs error:', err);
    throw new ApiError(500, "Failed to export jobs CSV");
  }
}

export function exportSupportToCSV(tickets: any[], res: Response) {
  try {
    const data = tickets.map((t, i) => ({
      'Sl No': i + 1,
      'Username': t.user?.name || '',
      'Email': t.user?.email || '',
      'Issue Title': t.reason || '',
      'Issue Date': t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '',
      'Status': t.status || ''
    }));

    const fields = ['Sl No', 'Username', 'Email', 'Issue Title', 'Issue Date', 'Status'];
    const csv = parse(data, { fields });

    const outputPath = path.join(process.cwd(), 'uploads', 'doc', `support-tickets-${Date.now()}.csv`);
    fs.writeFileSync(outputPath, csv);

    postDeleteFile(outputPath);
    res.download(outputPath);
  } catch (err) {
    console.error('CSV support error:', err);
    throw new ApiError(500, "Failed to export support CSV");
  }
}