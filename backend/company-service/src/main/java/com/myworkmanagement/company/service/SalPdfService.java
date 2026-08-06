package com.myworkmanagement.company.service;

import com.myworkmanagement.company.dto.TaskContractUsageDTO;
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
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.IntStream;

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

    private String resolveClientName(TaskDTO task) {
        if (task.getClientName() != null && !task.getClientName().trim().isEmpty()) {
            return task.getClientName();
        }
        return "No Client";
    }

    private YearMonth resolveTaskYearMonth(TaskDTO task) {
        if (task.getStartDate() == null) {
            return null;
        }
        return YearMonth.from(task.getStartDate());
    }

    private String resolveTaskMonthLabel(TaskDTO task) {
        YearMonth yearMonth = resolveTaskYearMonth(task);
        if (yearMonth == null) {
            return "N/D";
        }
        return yearMonth.format(MONTH_FORMATTER);
    }

    /**
     * Groups tasks by month (from startDate) then by client, preserving relative order within each group.
     */
    private List<TaskDTO> groupTasksByMonthAndClient(List<TaskDTO> tasks) {
        return IntStream.range(0, tasks.size())
            .boxed()
            .sorted(Comparator
                .comparing((Integer i) -> resolveTaskYearMonth(tasks.get(i)),
                    Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(i -> resolveClientName(tasks.get(i)), String.CASE_INSENSITIVE_ORDER)
                .thenComparingInt(i -> i))
            .map(tasks::get)
            .collect(java.util.stream.Collectors.toCollection(ArrayList::new));
    }

    /**
     * Draws the horizontal line and column titles (N° Task, Descrizione, Ore, Importo, Importo+IVA).
     * @return the y position after drawing the header
     */
    private float drawTableColumnHeaders(PDPageContentStream contentStream, float yPosition,
                                         float margin, float pageWidth,
                                         float col1X, float col2X, float col3X, float col4X, float col5X)
            throws IOException {
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

        return yPosition;
    }

    /**
     * Formats a number using Italian format (thousands separator: dot, decimal: comma)
     */
    private String formatItalianNumber(BigDecimal number) {
        return ITALIAN_NUMBER_FORMAT.format(number);
    }

    /**
     * Resolves the SAL amount that still needs to be billed for a task.
     * For partially billed tasks, subtract portions that already have an invoice.
     */
    private BigDecimal resolveSalAmount(TaskDTO task) {
        BigDecimal hours = task.getHoursWorked() != null ? task.getHoursWorked() : BigDecimal.ZERO;
        BigDecimal rate = task.getRateUsed() != null ? task.getRateUsed() : BigDecimal.ZERO;
        BigDecimal baseAmount = task.getBillableAmount() != null
            ? task.getBillableAmount()
            : hours.multiply(rate);

        if (task.getContractUsages() == null || task.getContractUsages().isEmpty()) {
            return baseAmount;
        }

        BigDecimal alreadyBilledAmount = task.getContractUsages().stream()
            .filter(usage -> Boolean.TRUE.equals(usage.getIsBilled())
                || (usage.getInvoiceId() != null && !usage.getInvoiceId().isBlank()))
            .map(usage -> usage.getAmountUsed() != null ? usage.getAmountUsed() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal remainingToBill = baseAmount.subtract(alreadyBilledAmount);
        return remainingToBill.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : remainingToBill;
    }

    private BigDecimal resolveHoursFromAmount(BigDecimal amount, BigDecimal rate) {
        if (rate.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return amount.divide(rate, 2, java.math.RoundingMode.HALF_UP);
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
     * Adds page numbers at the bottom-right corner of every page.
     */
    private void addPageNumbers(PDDocument document, float margin) throws IOException {
        int totalPages = document.getNumberOfPages();
        PDType1Font font = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
        float fontSize = 9f;
        float bottomY = 25f;

        for (int i = 0; i < totalPages; i++) {
            PDPage page = document.getPage(i);
            float pageWidth = page.getMediaBox().getWidth();
            String pageLabel = (i + 1) + " / " + totalPages;
            float textWidth = font.getStringWidth(pageLabel) / 1000 * fontSize;

            try (PDPageContentStream pageStream = new PDPageContentStream(
                    document, page, PDPageContentStream.AppendMode.APPEND, true, true)) {
                pageStream.beginText();
                pageStream.setFont(font, fontSize);
                pageStream.newLineAtOffset(pageWidth - margin - textWidth, bottomY);
                pageStream.showText(pageLabel);
                pageStream.endText();
            }
        }
    }

    /**
     * Generates a SAL PDF document matching the formal Italian business document format
     */
    public byte[] generateSalPdf(List<TaskDTO> tasks, String userEmail, String userName, 
                                 String userAddress, String userPhone, String userEmailAddress,
                                 String projectName, LocalDate reportMonth) throws IOException {
        return generateSalPdf(tasks, userEmail, userName, userAddress, userPhone, 
            userEmailAddress, projectName, reportMonth, null, null, null);
    }

    public byte[] generateSalPdf(List<TaskDTO> tasks, String userEmail, String userName, 
                                 String userAddress, String userPhone, String userEmailAddress,
                                 String projectName, LocalDate reportMonth,
                                 String contractCode, java.math.BigDecimal contractAmountAvailable) throws IOException {
        return generateSalPdf(tasks, userEmail, userName, userAddress, userPhone,
            userEmailAddress, projectName, reportMonth, contractCode, contractAmountAvailable, null);
    }

    public byte[] generateSalPdf(List<TaskDTO> tasks, String userEmail, String userName, 
                                 String userAddress, String userPhone, String userEmailAddress,
                                 String projectName, LocalDate reportMonth,
                                 String contractCode, java.math.BigDecimal contractAmountAvailable,
                                 String note) throws IOException {
        
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

        // Contract info
        if (contractCode != null && !contractCode.isEmpty()) {
            yPosition -= 5;
            String contractInfo = "Contratto: " + sanitizeTextForPdf(contractCode);
            if (contractAmountAvailable != null) {
                contractInfo += " - Importo residuo: " + formatItalianNumber(contractAmountAvailable) + " EUR";
            }
            contentStream.beginText();
            contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 10);
            contentStream.newLineAtOffset(margin, yPosition);
            contentStream.showText(contractInfo);
            contentStream.endText();
            yPosition -= 15;
        }

        // Optional note section — only when note text is provided (before task table)
        if (note != null && !note.trim().isEmpty()) {
            String sanitizedNote = sanitizeTextForPdf(note.trim());
            float noteMaxWidth = pageWidth - 2 * margin;
            PDType1Font noteFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA_OBLIQUE);
            java.util.List<String> noteLines = wrapText(sanitizedNote , noteMaxWidth, noteFont, 10);

            yPosition -= 20;
            contentStream.beginText();
            contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD_OBLIQUE), 10);
            contentStream.newLineAtOffset(margin, yPosition);
            contentStream.showText("NOTE:");
            contentStream.endText();

            yPosition -= 18;
            for (String line : noteLines) {
                contentStream.beginText();
                contentStream.setFont(noteFont, 10);
                contentStream.newLineAtOffset(margin, yPosition);
                contentStream.showText(line);
                contentStream.endText();
                yPosition -= 15;
            }
        }

        // Column layout — month header + table columns are drawn per month section
        yPosition -= 10;
        float col1X = margin; // N° Task
        float col2X = margin + 70; // Descrizione
        float col3X = pageWidth - margin - 200; // Ore
        float col4X = pageWidth - margin - 150; // Importo
        float col5X = pageWidth - margin - 80; // Importo+IVA
        float descMaxWidth = col3X - col2X - 10; // Max width for description column

        // Table rows — group by month then client
        List<TaskDTO> groupedTasks = groupTasksByMonthAndClient(tasks);

        BigDecimal totalHours = BigDecimal.ZERO;
        BigDecimal totalAmount = BigDecimal.ZERO;
        BigDecimal totalAmountWithVat = BigDecimal.ZERO;
        // Overall per-client totals (across months), shown before the final Totale importo
        Map<String, BigDecimal[]> overallClientTotals = new LinkedHashMap<>();

        long distinctClientCount = groupedTasks.stream().map(this::resolveClientName).distinct().count();
        boolean multipleClients = distinctClientCount > 1;

        String activeMonthLabel = null;
        String activeClient = null;
        BigDecimal clientHours = BigDecimal.ZERO;
        BigDecimal clientAmount = BigDecimal.ZERO;
        BigDecimal clientAmountWithVat = BigDecimal.ZERO;
        BigDecimal monthHours = BigDecimal.ZERO;
        BigDecimal monthAmount = BigDecimal.ZERO;
        BigDecimal monthAmountWithVat = BigDecimal.ZERO;

        for (int i = 0; i < groupedTasks.size(); i++) {
            TaskDTO task = groupedTasks.get(i);
            String monthLabel = resolveTaskMonthLabel(task);
            String clientName = resolveClientName(task);
            String nextMonthLabel = (i + 1 < groupedTasks.size())
                ? resolveTaskMonthLabel(groupedTasks.get(i + 1)) : null;
            String nextClient = (i + 1 < groupedTasks.size())
                ? resolveClientName(groupedTasks.get(i + 1)) : null;

            boolean monthChanged = !monthLabel.equals(activeMonthLabel);
            if (monthChanged) {
                if (yPosition < 240) {
                    contentStream.close();
                    PDPage newPage = new PDPage();
                    document.addPage(newPage);
                    contentStream = new PDPageContentStream(document, newPage);
                    yPosition = pageHeight - margin - 40;
                }

                // Month/year label, then the line + column titles
                yPosition -= 25;
                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 12);
                contentStream.newLineAtOffset(margin, yPosition);
                contentStream.showText("Mese: " + monthLabel);
                contentStream.endText();

                yPosition -= 15;
                yPosition = drawTableColumnHeaders(contentStream, yPosition, margin, pageWidth,
                    col1X, col2X, col3X, col4X, col5X);

                activeMonthLabel = monthLabel;
                activeClient = null; // reprint client header under the new month
                monthHours = BigDecimal.ZERO;
                monthAmount = BigDecimal.ZERO;
                monthAmountWithVat = BigDecimal.ZERO;
            }

            if (!clientName.equals(activeClient)) {
                if (!"No Client".equals(clientName)) {
                    if (yPosition < 200) {
                        contentStream.close();
                        PDPage newPage = new PDPage();
                        document.addPage(newPage);
                        contentStream = new PDPageContentStream(document, newPage);
                        yPosition = pageHeight - margin - 40;
                        yPosition = drawTableColumnHeaders(contentStream, yPosition, margin, pageWidth,
                            col1X, col2X, col3X, col4X, col5X);
                    }

                    yPosition -= 25;
                    contentStream.beginText();
                    contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 11);
                    contentStream.newLineAtOffset(margin, yPosition);
                    contentStream.showText("Cliente: " + sanitizeTextForPdf(clientName));
                    contentStream.endText();
                    yPosition -= 15;

                    contentStream.setLineWidth(0.5f);
                    contentStream.moveTo(margin, yPosition);
                    contentStream.lineTo(pageWidth - margin, yPosition);
                    contentStream.stroke();
                    yPosition -= 10;
                }
                activeClient = clientName;
                clientHours = BigDecimal.ZERO;
                clientAmount = BigDecimal.ZERO;
                clientAmountWithVat = BigDecimal.ZERO;
            }

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
                    yPosition = drawTableColumnHeaders(contentStream, yPosition, margin, pageWidth,
                        col1X, col2X, col3X, col4X, col5X);
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

                // Amount: for partially billed tasks show only the not-yet-billed portion in SAL
                BigDecimal amount = resolveSalAmount(task);
                // Hours: keep the actual task total hours on the main task row
                BigDecimal hours = task.getHoursWorked() != null ? task.getHoursWorked() : BigDecimal.ZERO;
                BigDecimal rate = task.getRateUsed() != null ? task.getRateUsed() : BigDecimal.ZERO;
                // Hours to bill: used for subtotals/totals
                BigDecimal billableHours = resolveHoursFromAmount(amount, rate);
                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 9);
                contentStream.newLineAtOffset(col3X, rowStartY);
                contentStream.showText(formatItalianNumber(hours));
                contentStream.endText();

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

                // Contract usage sub-rows
                if (task.getContractUsages() != null && !task.getContractUsages().isEmpty()) {
                    for (TaskContractUsageDTO usage : task.getContractUsages()) {
                        yPosition -= 12;
                        if (yPosition < 100) {
                            contentStream.close();
                            PDPage contractPage = new PDPage();
                            document.addPage(contractPage);
                            contentStream = new PDPageContentStream(document, contractPage);
                            yPosition = pageHeight - margin - 40;
                        }
                        BigDecimal usageAmount = usage.getAmountUsed() != null ? usage.getAmountUsed() : BigDecimal.ZERO;
                        BigDecimal usageHours = resolveHoursFromAmount(usageAmount, rate);
                        boolean usageBilled = Boolean.TRUE.equals(usage.getIsBilled())
                                || (usage.getInvoiceId() != null && !usage.getInvoiceId().isBlank());
                        String billingSuffix = "";
                        if (usageBilled) {
                            String billingDateLabel = usage.getBillingDate() != null
                                    ? usage.getBillingDate().format(DATE_FORMATTER)
                                    : "N/D";
                            billingSuffix = " (Billed " + billingDateLabel + ")";
                        }
                        String contractInfo = "Contratto: " + sanitizeTextForPdf(usage.getContractCode())
                                + " - Ore: " + formatItalianNumber(usageHours)
                                + " - Importo: " + formatItalianNumber(usageAmount)
                                + billingSuffix;
                        contentStream.beginText();
                        contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_OBLIQUE), 7);
                        contentStream.newLineAtOffset(col2X + 10, yPosition);
                        contentStream.showText(contractInfo);
                        contentStream.endText();
                    }
                }

                // Add to client / month / overall totals
                clientHours = clientHours.add(billableHours);
                clientAmount = clientAmount.add(amount);
                clientAmountWithVat = clientAmountWithVat.add(amountWithVat);

                monthHours = monthHours.add(billableHours);
                monthAmount = monthAmount.add(amount);
                monthAmountWithVat = monthAmountWithVat.add(amountWithVat);
                
                totalHours = totalHours.add(billableHours);
                totalAmount = totalAmount.add(amount);
                totalAmountWithVat = totalAmountWithVat.add(amountWithVat);

                BigDecimal[] overallClient = overallClientTotals.computeIfAbsent(clientName,
                    k -> new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO});
                overallClient[0] = overallClient[0].add(billableHours);
                overallClient[1] = overallClient[1].add(amount);
                overallClient[2] = overallClient[2].add(amountWithVat);

            boolean endOfClientBlock = nextClient == null
                || !clientName.equals(nextClient)
                || nextMonthLabel == null
                || !monthLabel.equals(nextMonthLabel);
            if (endOfClientBlock && (multipleClients || !"No Client".equals(clientName))) {
                if (yPosition < 100) {
                    contentStream.close();
                    PDPage newPage = new PDPage();
                    document.addPage(newPage);
                    contentStream = new PDPageContentStream(document, newPage);
                    yPosition = pageHeight - margin - 40;
                }
                
                yPosition -= 15;
                contentStream.setLineWidth(0.5f);
                contentStream.moveTo(margin, yPosition);
                contentStream.lineTo(pageWidth - margin, yPosition);
                contentStream.stroke();
                
                yPosition -= 15;
                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 9);
                contentStream.newLineAtOffset(col2X, yPosition);
                contentStream.showText("Subtotale " + (!"No Client".equals(clientName) ? sanitizeTextForPdf(clientName) : ""));
                contentStream.endText();
                
                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 9);
                contentStream.newLineAtOffset(col3X, yPosition);
                contentStream.showText(formatItalianNumber(clientHours));
                contentStream.endText();
                
                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 9);
                contentStream.newLineAtOffset(col4X, yPosition);
                contentStream.showText(formatItalianNumber(clientAmount));
                contentStream.endText();
                
                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 9);
                contentStream.newLineAtOffset(col5X, yPosition);
                contentStream.showText(formatItalianNumber(clientAmountWithVat));
                contentStream.endText();
                
                yPosition -= 20; // Extra space after subtotal
            }

            // Month subtotal at the end of each month section
            boolean endOfMonth = nextMonthLabel == null || !monthLabel.equals(nextMonthLabel);
            if (endOfMonth) {
                if (yPosition < 100) {
                    contentStream.close();
                    PDPage newPage = new PDPage();
                    document.addPage(newPage);
                    contentStream = new PDPageContentStream(document, newPage);
                    yPosition = pageHeight - margin - 40;
                }

                yPosition -= 15;
                contentStream.setLineWidth(1f);
                contentStream.moveTo(margin, yPosition);
                contentStream.lineTo(pageWidth - margin, yPosition);
                contentStream.stroke();

                yPosition -= 18;
                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 10);
                contentStream.newLineAtOffset(col2X, yPosition);
                contentStream.showText("Subtotale " + monthLabel);
                contentStream.endText();

                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 10);
                contentStream.newLineAtOffset(col3X, yPosition);
                contentStream.showText(formatItalianNumber(monthHours));
                contentStream.endText();

                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 10);
                contentStream.newLineAtOffset(col4X, yPosition);
                contentStream.showText(formatItalianNumber(monthAmount));
                contentStream.endText();

                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 10);
                contentStream.newLineAtOffset(col5X, yPosition);
                contentStream.showText(formatItalianNumber(monthAmountWithVat));
                contentStream.endText();

                yPosition -= 15;
            }
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

        // Per-client totals (before main Totale importo)
        if (!overallClientTotals.isEmpty()) {
            for (Map.Entry<String, BigDecimal[]> entry : overallClientTotals.entrySet()) {
                String clientLabel = "No Client".equals(entry.getKey())
                    ? "Senza cliente"
                    : sanitizeTextForPdf(entry.getKey());
                BigDecimal[] totals = entry.getValue();

                if (yPosition < 100) {
                    contentStream.close();
                    PDPage newPage = new PDPage();
                    document.addPage(newPage);
                    contentStream = new PDPageContentStream(document, newPage);
                    yPosition = pageHeight - margin - 40;
                }

                yPosition -= 18;
                contentStream.beginText();
                contentStream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 10);
                contentStream.newLineAtOffset(margin, yPosition);
                contentStream.showText(String.format("Totale %s: %s€ (+IVA %s€) (%s ore)",
                    clientLabel,
                    formatItalianNumber(totals[1]),
                    formatItalianNumber(totals[2]),
                    formatItalianNumber(totals[0])));
                contentStream.endText();
            }
        }

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

        addPageNumbers(document, margin);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        document.save(baos);
        document.close();

        return baos.toByteArray();
    }
}

