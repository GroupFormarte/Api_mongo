import { Request, Response } from "express";
import ejs from "ejs";
import puppeteer from "puppeteer";
import path from "path";
import { PDFDocument } from "pdf-lib";
import fs from "fs";
import crypto from "crypto";
import { pushToWSClients } from "../../../websocket/sse.service";
import { getRequestBaseUrl } from "../../../../shared/utils/requestUrl";

export const generateReport = async (req: Request, res: Response) => {
  const students = req.body.listado;

  if (!students || !Array.isArray(students)) {
    return;
  }

  // Ordenar por posición ascendente
  const studentsOrder = [...students].sort(
    (a, b) => (a.puesto ?? 0) - (b.puesto ?? 0),
  );
  console.log(students[0]);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const pdfDocs = [];
  const logoPath = path.join(
    process.cwd(),
    "storage/templates/logo_podium.png",
  );
  const logoBase64 = fs.readFileSync(logoPath, { encoding: "base64" });
  const logoDataUrl = `data:image/png;base64,${logoBase64}`;
  for (const student of studentsOrder) {
    const html = await ejs.renderFile(
      // path.join(__dirname, "../../templates/report.ejs"),
      path.join(process.cwd(), "storage/templates/report.ejs"),
      {
        student,
        logoUrl: logoDataUrl,
        tipe_inform: student.tipoExamen ?? "udea",
      },
      { async: true },
    );

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });
    pdfDocs.push(pdfBuffer);
  }

  await browser.close();

  // Crear un nuevo documento PDF combinado
  const mergedPdf = await PDFDocument.create();

  for (const pdfBytes of pdfDocs) {
    const pdf = await PDFDocument.load(pdfBytes);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const finalPdf = await mergedPdf.save();
  const tempId = crypto.randomUUID();
  const filePath = path.join(process.cwd(), `storage/uploads/${tempId}.pdf`);
  fs.writeFileSync(filePath, finalPdf);

  //   res.set({
  //     "Content-Type": "application/pdf",
  //     "Content-Disposition": "attachment; filename=reportes.pdf",
  //   });
  //   res.send(Buffer.from(finalPdf));
  const baseUrl = getRequestBaseUrl(req);
  const fileUrl = `${baseUrl}/uploads/${tempId}.pdf`;

  // Enviar el evento SSE
  pushToWSClients({
    status: "pdf-ready",
    url: fileUrl,
    message: "Tu archivo está listo para descargar",
  });

  // Respuesta vacía si no se descarga directamente
  res.status(202).send({ message: "Generación en proceso" });

  // Opción: borrar el archivo después de 30 minutos
  setTimeout(
    () => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Archivo temporal eliminado: ${filePath}`);
      }
    },
    30 * 60 * 1000,
  );
};
