import { jsPDF } from "jspdf";
import { db } from "./firebase";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

// Generate PDF for ticket confirmation
export const generatePDFBase64 = async (purchaseData, session, course) => {
  try {
    console.log("Generating PDF for ticket:", purchaseData);
    
    // Create new PDF document
    const pdf = new jsPDF();
    
    // Add content to PDF
    pdf.setFontSize(20);
    pdf.text("TICKET CONFIRMATION", 105, 20, { align: "center" });
    
    pdf.setFontSize(12);
    pdf.text(`Course: ${course.title}`, 20, 40);
    pdf.text(`Session: ${session.title}`, 20, 50);
    pdf.text(`Date: ${session.date} at ${session.time}`, 20, 60);
    pdf.text(`Location: ${session.location || 'TBD'}`, 20, 70);
    pdf.text(`Price: R${purchaseData.price}`, 20, 80);
    pdf.text(`Confirmation Code: ${purchaseData.confirmationCode}`, 20, 90);
    pdf.text(`Ticket Number: ${purchaseData.ticketNumber}`, 20, 100);
    
    pdf.setFontSize(10);
    pdf.text("IMPORTANT INFORMATION:", 20, 120);
    pdf.text("• Present this confirmation code at the session", 20, 130);
    pdf.text("• Non-refundable but transferable to another session", 20, 140);
    pdf.text("• Keep this confirmation for your records", 20, 150);
    
    // Convert to base64
    const pdfBase64 = pdf.output('datauristring').split(',')[1];
    console.log("PDF generated successfully");
    
    return pdfBase64;
  } catch (error) {
    console.error("Error generating PDF:", error);
    return null;
  }
};

// Download PDF for ticket
export const downloadTicketPDF = (ticket, session, course) => {
  try {
    console.log("Downloading PDF for ticket:", ticket);
    
    // Create new PDF document
    const pdf = new jsPDF();
    
    // Add content to PDF
    pdf.setFontSize(20);
    pdf.text("TICKET CONFIRMATION", 105, 20, { align: "center" });
    
    pdf.setFontSize(12);
    pdf.text(`Course: ${course?.title || ticket.course_title || ticket.courseTitle}`, 20, 40);
    pdf.text(`Session: ${session?.title || ticket.session_title || ticket.sessionTitle}`, 20, 50);
    const ticketDate = session?.date || ticket.session_date || ticket.sessionDate;
    const ticketTime = session?.time || ticket.session_time || ticket.sessionTime || '';
    pdf.text(`Date: ${ticketDate}${ticketTime ? ` at ${ticketTime}` : ''}`, 20, 60);
    pdf.text(`Location: ${session?.venue || session?.location || ticket.session_venue || ticket.location || 'TBD'}`, 20, 70);
    pdf.text(`Price: R${ticket.amount ?? ticket.price ?? 0}`, 20, 80);
    pdf.text(`Confirmation Code: ${ticket.confirmationCode || ticket.ticket_number || ticket.ticketNumber || '—'}`, 20, 90);
    pdf.text(`Ticket Number: ${ticket.ticket_number || ticket.ticketNumber || ticket.ticket_id || '—'}`, 20, 100);
    
    pdf.setFontSize(10);
    pdf.text("IMPORTANT INFORMATION:", 20, 120);
    pdf.text("• Present this confirmation code at the session", 20, 130);
    pdf.text("• Non-refundable but transferable to another session", 20, 140);
    pdf.text("• Keep this confirmation for your records", 20, 150);
    
    // Download the PDF
    pdf.save(`ticket-${ticket.ticket_number || ticket.ticketNumber || ticket.ticket_id || 'ticket'}.pdf`);
    console.log("PDF downloaded successfully");
    
    return { success: true, message: "PDF downloaded successfully" };
  } catch (error) {
    console.error("Error downloading PDF:", error);
    return { success: false, error: error.message };
  }
};

// Get user tickets with PDF attachments
export const getUserTicketsWithPDFs = async (userId) => {
  try {
    console.log("Getting tickets for user:", userId);
    
    const purchasesQuery = query(
      collection(db, "purchases"),
      where("userId", "==", userId)
    );
    const purchasesSnapshot = await getDocs(purchasesQuery);
    
    const tickets = purchasesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log("Found tickets:", tickets.length);
    return tickets;
  } catch (error) {
    console.error("Error getting user tickets:", error);
    return [];
  }
};
