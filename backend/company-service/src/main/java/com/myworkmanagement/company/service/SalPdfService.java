package com.myworkmanagement.company.service;

import com.myworkmanagement.company.dto.TaskDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.core.io.ClassPathResource;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;

@Service
public class SalPdfService {

    private static final Logger log = LoggerFactory.getLogger(SalPdfService.class);
    private static final float VAT_RATE = 0.22f; // 22% Italian VAT
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale.ITALIAN);
    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy/MM", Locale.ITALIAN);
    
    // Italian number format: thousands separator is dot, decimal separator is comma
    private static final DecimalFormat ITALIAN_NUMBER_FORMAT;
    static {
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(Locale.ITALIAN);
        symbols.setGroupingSeparator('.');
        symbols.setDecimalSeparator(',');
        ITALIAN_NUMBER_FORMAT = new DecimalFormat("#,##0.00", symbols);
    }

    /**
     * Sanitizes text for PDF rendering by removing/replacing control characters
     * that are not supported by standard fonts with WinAnsiEncoding
     */
    private String sanitizeTextForPdf(String text) {
        if (text == null) {
            return "";
        }
        // Replace newlines and other control characters with spaces
        return text.replaceAll("[\\r\\n\\t]", " ").replaceAll("\\p{Cntrl}", "");
    }

    /**
     * Formats a number using Italian format (thousands separator: dot, decimal: comma)
     */
    private String formatItalianNumber(BigDecimal number) {
        return ITALIAN_NUMBER_FORMAT.format(number);
    }

    /**
     * Wraps text to fit within a specified width
     */
    private java.util.List<String> wrapText(String text, float maxWidth, PDType1Font font, float fontSize) throws IOException {
        java.util.List<String> lines = new java.util.ArrayList<>();
        if (text == null || text.isEmpty()) {
            return lines;
        }
        
        String[] words = text.split(" ");
        StringBuilder currentLine = new StringBuilder();
        
        for (String word : words) {
            String testLine = currentLine.length() > 0 ? currentLine + " " + word : word;
            float width = font.getStringWidth(testLine) / 1000 * fontSize;
            
            if (width > maxWidth && currentLine.length() > 0) {
                lines.add(currentLine.toString());
                currentLine = new StringBuilder(word);
            } else {
                currentLine = new StringBuilder(testLine);
            }
        }
        
        if (currentLine.length() > 0) {
            lines.add(currentLine.toString());
        }
        
        return lines;
    }

    /**
     * Generates a SAL PDF document matching the formal Italian business document format
     */
    public byte[] generateSalPdf(List<TaskDTO> tasks, String userEmail, String userName, 
                                 String userAddress, String userPhone, String userEmailAddress,
                                 String projectName, LocalDate reportMonth) throws IOException {
        
        if (tasks == null || tasks.isEmpty()) {
            throw new IllegalArgumentException("Cannot generate SAL PDF: no tasks provided");
        }
        
        PDDocument document = new PDDocument();
        PDPage page = new PDPage();
        document.addPage(page);

        PDPageContentStream contentStream = new PDPageContentStream(document, page);

        float pageWidth = page.getMediaBox().getWidth();
        float pageHeight = page.getMediaBox().getHeight();
        float margin = 50;
        float yPosition = pageHeight - margin;

        // Load and draw header image at the top
        try {
            // Try file system first
            String[] headImagePaths = {
                "head.png",
                "./head.png",
                "src/main/resources/head.png",
                System.getProperty("user.home") + "/head.png",
                System.getProperty("user.dir") + "/head.png"
            };
            
            PDImageXObject headImage = null;
            for (String pathStr : headImagePaths) {
                try {
                    Path path = Paths.get(pathStr);
                    if (Files.exists(path) && Files.isReadable(path)) {
                        log.info("Loading header image from file system: {}", pathStr);
                        byte[] imageBytes = Files.readAllBytes(path);
                        headImage = PDImageXObject.createFromByteArray(document, imageBytes, "head");
                        break;
                    }
                } catch (Exception e) {
                    log.debug("Could not load header image from file system path {}: {}", pathStr, e.getMessage());
                }
            }
            
            // If not found in file system, try classpath
            if (headImage == null) {
                try {
                    ClassPathResource headResource = new ClassPathResource("head.png");
                    if (headResource.exists() && headResource.isReadable()) {
                        log.info("Loading header image from classpath");
                        try (InputStream headStream = headResource.getInputStream()) {
                            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
                            byte[] data = new byte[1024];
                            int nRead;
                            while ((nRead = headStream.read(data, 0, data.length)) != -1) {
                                buffer.write(data, 0, nRead);
                            }
                            buffer.flush();
                            byte[] imageBytes = buffer.toByteArray();
                            headImage = PDImageXObject.createFromByteArray(document, imageBytes, "head");
                        }
                    }
                } catch (Exception e) {
                    log.debug("Could not load header image from classpath: {}", e.getMessage());
                }
            }
            
            // Draw header image if loaded
            if (headImage != null) {
                // Scale image to fit page width (with margins)
                float maxWidth = pageWidth - 2 * margin;
                float imgWidth = Math.min(maxWidth, headImage.getWidth());
                float imgHeight = (headImage.getHeight() / (float)headImage.getWidth()) * imgWidth;
                
                // Center the image horizontally
                float imgX = (pageWidth - imgWidth) / 2;
                float imgY = pageHeight - margin - imgHeight;
                
                contentStream.drawImage(headImage, imgX, imgY, imgWidth, imgHeight);
                log.info("Header image drawn successfully: {}x{} at position ({}, {})", imgWidth, imgHeight, imgX, imgY);
                
                // Adjust yPosition to account for header image
                yPosition = imgY - 20; // Add some space below the image
            } else {
                log.warn("Header image 'head.png' not found. Continuing without header image.");
            }
        } catch (Exception e) {
            log.error("Error loading header image: {}", e.getMessage(), e);
        }

        // // Header - Sender info (left side)
        // contentStream.beginText();
        // contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
        // contentStream.newLineAtOffset(margin, yPosition);
        // contentStream.showText(sanitizeTextForPdf(userName));
        // contentStream.endText();

        // yPosition -= 15;
        // contentStream.beginText();
        // contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 9);
        // contentStream.newLineAtOffset(margin, yPosition);
        // if (userAddress != null && !userAddress.isEmpty()) {
        //     contentStream.showText(sanitizeTextForPdf(userAddress));
        // }
        // contentStream.endText();

        // yPosition -= 12;
        // contentStream.beginText();
        // contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 9);
        // contentStream.newLineAtOffset(margin, yPosition);
        // if (userPhone != null && !userPhone.isEmpty()) {
        //     contentStream.showText(sanitizeTextForPdf(userPhone));
        // }
        // contentStream.endText();

        // yPosition -= 12;
        // contentStream.beginText();
        // contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 9);
        // contentStream.newLineAtOffset(margin, yPosition);
        // if (userEmailAddress != null && !userEmailAddress.isEmpty()) {
        //     contentStream.showText(sanitizeTextForPdf(userEmailAddress));
        // }
        // contentStream.endText();

        // // Header - Recipient info (right side)
        // float rightX = pageWidth - margin - 200;
        // yPosition = pageHeight - margin;
        // contentStream.beginText();
        // contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
        // contentStream.newLineAtOffset(rightX, yPosition);
        // contentStream.showText("DEDA NEXT Srl");
        // contentStream.endText();

        // yPosition -= 15;
        // contentStream.beginText();
        // contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 9);
        // contentStream.newLineAtOffset(rightX, yPosition);
        // contentStream.showText("Via di Spini, 50, 38121 Trento (TN)");
        // contentStream.endText();

        // yPosition -= 12;
        // contentStream.beginText();
        // contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 9);
        // contentStream.newLineAtOffset(rightX, yPosition);
        // contentStream.showText("P.IVA: 01727860221");
        // contentStream.endText();

        // Date and location
        yPosition = pageHeight - margin - 220;
        String location = userAddress != null && userAddress.contains(",") 
            ? userAddress.split(",")[0] 
            : "Andria";
        String date = LocalDate.now().format(DATE_FORMATTER);
        contentStream.beginText();
        contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
        contentStream.newLineAtOffset(margin, yPosition);
        contentStream.showText(location + ", " + date);
        contentStream.endText();

        // Subject line
        yPosition -= 25;
        String monthYear = reportMonth != null 
            ? reportMonth.format(MONTH_FORMATTER) 
            : LocalDate.now().format(MONTH_FORMATTER);
        contentStream.beginText();
        contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 11);
        contentStream.newLineAtOffset(margin, yPosition);
        contentStream.showText("Oggetto: Rendicontazione mese " + monthYear);
        contentStream.endText();

        // Introductory paragraph
        yPosition -= 25;
        String introText = "Di seguito sono riportati in dettaglio i tasks di lavorazione e i relativi giorni pattuiti con il responsabile di Deda Next per il progetto “Sviluppi back end framework procedimenti”\"" ;
        introText = sanitizeTextForPdf(introText);
        
        // Wrap introduction text if needed
        float introMaxWidth = pageWidth - 2 * margin;
        java.util.List<String> introLines = wrapText(introText, introMaxWidth, 
            new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
        
        for (String line : introLines) {
            contentStream.beginText();
            contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
            contentStream.newLineAtOffset(margin, yPosition);
            contentStream.showText(line);
            contentStream.endText();
            yPosition -= 15;
        }

        // Table header
        yPosition -= 20;
        float col1X = margin; // N° Task
        float col2X = margin + 70; // Descrizione
        float col3X = pageWidth - margin - 200; // Ore
        float col4X = pageWidth - margin - 150; // Importo
        float col5X = pageWidth - margin - 80; // Importo+IVA
        float descMaxWidth = col3X - col2X - 10; // Max width for description column

        // Draw table header
        contentStream.setLineWidth(1f);
        contentStream.moveTo(margin, yPosition);
        contentStream.lineTo(pageWidth - margin, yPosition);
        contentStream.stroke();

        yPosition -= 20;
        contentStream.beginText();
        contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 9);
        contentStream.newLineAtOffset(col1X, yPosition);
        contentStream.showText("N° Task");
        contentStream.endText();

        contentStream.beginText();
        contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 9);
        contentStream.newLineAtOffset(col2X, yPosition);
        contentStream.showText("Descrizione");
        contentStream.endText();

        contentStream.beginText();
        contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 9);
        contentStream.newLineAtOffset(col3X, yPosition);
        contentStream.showText("Ore");
        contentStream.endText();

        contentStream.beginText();
        contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 9);
        contentStream.newLineAtOffset(col4X, yPosition);
        contentStream.showText("Importo");
        contentStream.endText();

        contentStream.beginText();
        contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 9);
        contentStream.newLineAtOffset(col5X, yPosition);
        contentStream.showText("Importo+IVA");
        contentStream.endText();

        // Table rows
        BigDecimal totalHours = BigDecimal.ZERO;
        BigDecimal totalAmount = BigDecimal.ZERO;
        BigDecimal totalAmountWithVat = BigDecimal.ZERO;

        for (TaskDTO task : tasks) {
            // Prepare description to calculate row height (using title field)
            String description = task.getTitle() != null ? task.getTitle() : task.getDescription();
            description = sanitizeTextForPdf(description);
            PDType1Font descFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            float descFontSize = 9;
            java.util.List<String> descLines = wrapText(description, descMaxWidth, descFont, descFontSize);
            
            // Calculate row height based on description lines
            float rowHeight = Math.max(20, descLines.size() * 12);
            
            // Check if we need a new page (account for row height + totals space)
            yPosition -= 20;
            if (yPosition - rowHeight < 150) { // Leave space for totals and signature
                // New page if needed
                contentStream.close();
                PDPage newPage = new PDPage();
                document.addPage(newPage);
                contentStream = new PDPageContentStream(document, newPage);
                yPosition = pageHeight - margin - 40;
                // Redraw table header on new page
                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 9);
                contentStream.newLineAtOffset(col1X, yPosition);
                contentStream.showText("N° Task");
                contentStream.endText();
                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 9);
                contentStream.newLineAtOffset(col2X, yPosition);
                contentStream.showText("Descrizione");
                contentStream.endText();
                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 9);
                contentStream.newLineAtOffset(col3X, yPosition);
                contentStream.showText("Ore");
                contentStream.endText();
                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 9);
                contentStream.newLineAtOffset(col4X, yPosition);
                contentStream.showText("Importo");
                contentStream.endText();
                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 9);
                contentStream.newLineAtOffset(col5X, yPosition);
                contentStream.showText("Importo+IVA");
                contentStream.endText();
                yPosition -= 20;
            }

            // Task number
            float rowStartY = yPosition;
            contentStream.beginText();
            contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 9);
            contentStream.newLineAtOffset(col1X, yPosition);
            contentStream.showText(sanitizeTextForPdf(task.getTicketId()));
            contentStream.endText();

            // Description (wrap if needed)
            float descY = yPosition;
            for (String line : descLines) {
                contentStream.beginText();
                contentStream.setFont(descFont, descFontSize);
                contentStream.newLineAtOffset(col2X, descY);
                contentStream.showText(line);
                contentStream.endText();
                descY -= 12; // Line spacing
            }
            
            yPosition -= rowHeight;

            // Hours (aligned to top of row)
            BigDecimal hours = task.getHoursWorked() != null ? task.getHoursWorked() : BigDecimal.ZERO;
            contentStream.beginText();
            contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 9);
            contentStream.newLineAtOffset(col3X, rowStartY);
            contentStream.showText(formatItalianNumber(hours));
            contentStream.endText();

            // Amount (hours * rate) - aligned to top of row
            BigDecimal rate = task.getRateUsed() != null ? task.getRateUsed() : BigDecimal.ZERO;
            BigDecimal amount = hours.multiply(rate);
            contentStream.beginText();
            contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 9);
            contentStream.newLineAtOffset(col4X, rowStartY);
            contentStream.showText(formatItalianNumber(amount));
            contentStream.endText();

            // Amount with VAT - aligned to top of row
            BigDecimal amountWithVat = amount.multiply(BigDecimal.valueOf(1 + VAT_RATE));
            contentStream.beginText();
            contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 9);
            contentStream.newLineAtOffset(col5X, rowStartY);
            contentStream.showText(formatItalianNumber(amountWithVat));
            contentStream.endText();

            totalHours = totalHours.add(hours);
            totalAmount = totalAmount.add(amount);
            totalAmountWithVat = totalAmountWithVat.add(amountWithVat);
        }

        // Totals row
        yPosition -= 25;
        contentStream.setLineWidth(1f);
        contentStream.moveTo(margin, yPosition);
        contentStream.lineTo(pageWidth - margin, yPosition);
        contentStream.stroke();

        yPosition -= 20;
        contentStream.beginText();
        contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 9);
        contentStream.newLineAtOffset(col2X, yPosition);
        contentStream.showText("Totale");
        contentStream.endText();

        contentStream.beginText();
        contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 9);
        contentStream.newLineAtOffset(col3X, yPosition);
        contentStream.showText(formatItalianNumber(totalHours));
        contentStream.endText();

        contentStream.beginText();
        contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 9);
        contentStream.newLineAtOffset(col4X, yPosition);
        contentStream.showText(formatItalianNumber(totalAmount));
        contentStream.endText();

        contentStream.beginText();
        contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 9);
        contentStream.newLineAtOffset(col5X, yPosition);
        contentStream.showText(formatItalianNumber(totalAmountWithVat));
        contentStream.endText();

        // Overall total
        yPosition -= 30;
        contentStream.beginText();
        contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 11);
        contentStream.newLineAtOffset(margin, yPosition);
        contentStream.showText(String.format("Totale importo %s€ (+IVA %s€)", 
            formatItalianNumber(totalAmount), formatItalianNumber(totalAmountWithVat)));
        contentStream.endText();

        // Signature section
        yPosition -= 50;
        float signatureX = pageWidth - margin - 150;
        float signatureY = yPosition;
        
        // Signature text (drawn first)
        contentStream.beginText();
        contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
        contentStream.newLineAtOffset(signatureX, signatureY);
        contentStream.showText("dott. " + sanitizeTextForPdf(userName));
        contentStream.endText();
        
        // Move down for signature image (below the text)
        signatureY -= 20;
        
        // Try to load signature image from multiple locations
        // Priority: 1) File system path, 2) Classpath resources
        boolean imageDrawn = false;
        String[] imageFormats = {"signature.png", "signature.jpg", "signature.jpeg"};
        
        // Try file system paths first (more reliable)
        String[] possiblePaths = {
            "signature.png",  // Current directory
            "./signature.png", // Current directory explicit
            "src/main/resources/signature.png", // Project resources
            System.getProperty("user.home") + "/signature.png", // User home
            System.getProperty("user.dir") + "/signature.png" // Working directory
        };
        
        // Try file system paths
        for (String pathStr : possiblePaths) {
            for (String format : imageFormats) {
                String testPath = pathStr.replace("signature.png", format);
                try {
                    Path path = Paths.get(testPath);
                    if (Files.exists(path) && Files.isReadable(path)) {
                        log.info("Loading signature image from file system: {}", testPath);
                        byte[] imageBytes = Files.readAllBytes(path);
                        
                        PDImageXObject signatureImage = PDImageXObject.createFromByteArray(document, 
                            imageBytes, "signature");
                        
                        // Draw signature image (scale to reasonable size)
                        float imgWidth = 80;
                        float imgHeight = (signatureImage.getHeight() / (float)signatureImage.getWidth()) * imgWidth;
                        
                        // Draw image below the text
                        float imageY = signatureY - imgHeight;
                        contentStream.drawImage(signatureImage, signatureX, imageY, imgWidth, imgHeight);
                        log.info("Signature image drawn successfully: {}x{} at position ({}, {})", 
                            imgWidth, imgHeight, signatureX, imageY);
                        imageDrawn = true;
                        break;
                    }
                } catch (Exception e) {
                    log.debug("Could not load signature from file system path {}: {}", testPath, e.getMessage());
                }
            }
            if (imageDrawn) break;
        }
        
        // If not found in file system, try classpath resources
        if (!imageDrawn) {
            for (String imageFile : imageFormats) {
                try {
                    ClassPathResource signatureResource = new ClassPathResource(imageFile);
                    if (signatureResource.exists() && signatureResource.isReadable()) {
                        log.info("Loading signature image from classpath: {}", imageFile);
                        try (InputStream signatureStream = signatureResource.getInputStream()) {
                            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
                            byte[] data = new byte[1024];
                            int nRead;
                            while ((nRead = signatureStream.read(data, 0, data.length)) != -1) {
                                buffer.write(data, 0, nRead);
                            }
                            buffer.flush();
                            byte[] imageBytes = buffer.toByteArray();
                            
                            PDImageXObject signatureImage = PDImageXObject.createFromByteArray(document, 
                                imageBytes, "signature");
                            
                            // Draw signature image (scale to reasonable size)
                            float imgWidth = 80;
                            float imgHeight = (signatureImage.getHeight() / (float)signatureImage.getWidth()) * imgWidth;
                            
                            // Draw image below the text
                            float imageY = signatureY - imgHeight;
                            contentStream.drawImage(signatureImage, signatureX, imageY, imgWidth, imgHeight);
                            log.info("Signature image drawn successfully from classpath: {}x{} at position ({}, {})", 
                                imgWidth, imgHeight, signatureX, imageY);
                            imageDrawn = true;
                            break;
                        }
                    }
                } catch (Exception e) {
                    log.debug("Could not load signature image from classpath {}: {}", imageFile, e.getMessage());
                }
            }
        }
        
        if (!imageDrawn) {
            log.warn("Signature image not found. Tried file system paths and classpath. " +
                    "Please place signature.png in one of these locations: " +
                    "1) Current working directory, 2) src/main/resources/, 3) User home directory");
        }

        contentStream.close();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        document.save(baos);
        document.close();

        return baos.toByteArray();
    }
}

