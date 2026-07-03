import { format } from "date-fns";
import { fr } from "date-fns/locale";
import DOMPurify from "dompurify";

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, string | number | boolean | undefined>;
}

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  budget_min: number | null;
  budget_max: number | null;
  city: string | null;
  region: string | null;
  status: string;
  deadline: string | null;
  created_at: string;
  proposals_count: number;
  views_count: number;
}

interface UserProfile {
  full_name: string;
  email: string;
  phone?: string | null;
}

/**
 * Export projects to PDF
 * Uses browser's print functionality for a simple, accessible PDF export
 *
 * Security: HTML is sanitized with DOMPurify to prevent XSS attacks
 * Reference: OWASP ASVS V5.3.3, OWASP XSS Prevention Cheat Sheet
 */
export function exportProjectsToPDF(projects: Project[], profile: UserProfile) {
  // Create a hidden div for printing
  const printDiv = document.createElement("div");
  printDiv.style.display = "none";
  printDiv.id = "pdf-export-content";

  // Generate HTML content
  const html = generateProjectsHTML(projects, profile);

  // SECURITY: Sanitize HTML before injection to prevent XSS
  // DOMPurify removes any malicious scripts, event handlers, or dangerous attributes
  const sanitizedHTML = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'div', 'p', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'strong', 'em', 'u', 'ul', 'ol', 'li', 'table', 'thead',
      'tbody', 'tr', 'td', 'th', 'img', 'br', 'hr', 'header',
      'footer', 'section', 'article'
    ],
    ALLOWED_ATTR: ['class', 'style', 'id'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link', 'style'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'onblur']
  });

  printDiv.innerHTML = sanitizedHTML;

  // Add to body
  document.body.appendChild(printDiv);

  // Create a new window for printing
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Veuillez autoriser les pop-ups pour exporter en PDF");
    document.body.removeChild(printDiv);
    return;
  }

  // SECURITY: Use sanitized HTML in document.write
  // Styles are hardcoded and safe (not user-controlled)
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Mes Projets - BâtirNet</title>
        <style>
          ${getPrintStyles()}
        </style>
      </head>
      <body>
        ${sanitizedHTML}
      </body>
    </html>
  `);

  printWindow.document.close();

  // Wait for content to load, then print
  printWindow.onload = () => {
    printWindow.print();
    printWindow.onafterprint = () => {
      printWindow.close();
      document.body.removeChild(printDiv);
    };
  };
}

/**
 * Generate HTML for projects
 */
function generateProjectsHTML(projects: Project[], profile: UserProfile): string {
  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return "À discuter";
    if (min && max) return `${min.toLocaleString()} $ - ${max.toLocaleString()} $`;
    if (min) return `À partir de ${min.toLocaleString()} $`;
    if (max) return `Jusqu'à ${max.toLocaleString()} $`;
    return "À discuter";
  };

  const statusLabels: Record<string, string> = {
    open: "Ouvert",
    in_progress: "En cours",
    completed: "Complété",
    cancelled: "Annulé",
  };

  return `
    <div class="document">
      <header class="header">
        <div class="logo">
          <h1>BâtirNet</h1>
          <p class="tagline">Votre plateforme de construction au Québec</p>
        </div>
        <div class="export-info">
          <p><strong>Exporté le:</strong> ${format(new Date(), "d MMMM yyyy 'à' HH:mm", {
            locale: fr,
          })}</p>
          <p><strong>Client:</strong> ${profile.full_name}</p>
          ${profile.email ? `<p><strong>Email:</strong> ${profile.email}</p>` : ""}
        </div>
      </header>

      <div class="content">
        <h2>Mes Projets (${projects.length})</h2>
        
        ${projects
          .map(
            (project, index) => `
          <div class="project ${index > 0 ? "page-break-before" : ""}">
            <div class="project-header">
              <h3>${project.title}</h3>
              <span class="status status-${project.status}">${statusLabels[project.status] || project.status}</span>
            </div>
            
            <div class="project-details">
              <div class="detail-row">
                <div class="detail-item">
                  <span class="label">Catégorie:</span>
                  <span class="value">${project.category}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Créé le:</span>
                  <span class="value">${format(new Date(project.created_at), "d MMMM yyyy", {
                    locale: fr,
                  })}</span>
                </div>
              </div>

              <div class="detail-row">
                <div class="detail-item">
                  <span class="label">Budget:</span>
                  <span class="value">${formatBudget(project.budget_min, project.budget_max)}</span>
                </div>
                ${
                  project.deadline
                    ? `
                  <div class="detail-item">
                    <span class="label">Échéance:</span>
                    <span class="value">${format(new Date(project.deadline), "d MMMM yyyy", {
                      locale: fr,
                    })}</span>
                  </div>
                `
                    : ""
                }
              </div>

              ${
                project.city || project.region
                  ? `
                <div class="detail-row">
                  <div class="detail-item">
                    <span class="label">Localisation:</span>
                    <span class="value">${[project.city, project.region].filter(Boolean).join(", ")}</span>
                  </div>
                </div>
              `
                  : ""
              }

              <div class="detail-row">
                <div class="detail-item">
                  <span class="label">Propositions:</span>
                  <span class="value">${project.proposals_count}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Vues:</span>
                  <span class="value">${project.views_count}</span>
                </div>
              </div>

              <div class="description">
                <span class="label">Description:</span>
                <p>${project.description}</p>
              </div>
            </div>
          </div>
        `
          )
          .join("")}
      </div>

      <footer class="footer">
        <p>Document généré par BâtirNet - Plateforme de mise en relation pour projets de construction</p>
        <p class="contact">Contact: support@batirnet.com | www.batirnet.com</p>
      </footer>
    </div>
  `;
}

/**
 * CSS styles for print
 */
function getPrintStyles(): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1a1a1a;
      background: white;
    }

    .document {
      max-width: 210mm;
      margin: 0 auto;
      padding: 20mm;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 15mm;
      border-bottom: 2pt solid #e5e7eb;
      margin-bottom: 10mm;
    }

    .logo h1 {
      font-size: 24pt;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 2mm;
    }

    .logo .tagline {
      font-size: 10pt;
      color: #6b7280;
    }

    .export-info {
      text-align: right;
      font-size: 9pt;
      color: #4b5563;
    }

    .export-info p {
      margin-bottom: 1mm;
    }

    .content h2 {
      font-size: 18pt;
      color: #1f2937;
      margin-bottom: 8mm;
      padding-bottom: 3mm;
      border-bottom: 1pt solid #e5e7eb;
    }

    .project {
      margin-bottom: 10mm;
      padding: 5mm;
      border: 1pt solid #e5e7eb;
      border-radius: 2mm;
      background: #f9fafb;
    }

    .page-break-before {
      page-break-before: always;
    }

    .project-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4mm;
      padding-bottom: 3mm;
      border-bottom: 1pt solid #e5e7eb;
    }

    .project-header h3 {
      font-size: 14pt;
      color: #1f2937;
    }

    .status {
      padding: 2mm 4mm;
      border-radius: 1mm;
      font-size: 9pt;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-open {
      background: #dcfce7;
      color: #166534;
    }

    .status-in_progress {
      background: #dbeafe;
      color: #1e40af;
    }

    .status-completed {
      background: #f3f4f6;
      color: #374151;
    }

    .status-cancelled {
      background: #fee2e2;
      color: #991b1b;
    }

    .project-details {
      space-y: 3mm;
    }

    .detail-row {
      display: flex;
      gap: 10mm;
      margin-bottom: 3mm;
    }

    .detail-item {
      flex: 1;
    }

    .label {
      font-weight: 600;
      color: #6b7280;
      font-size: 9pt;
      display: inline-block;
      margin-right: 2mm;
    }

    .value {
      color: #1f2937;
    }

    .description {
      margin-top: 4mm;
      padding-top: 4mm;
      border-top: 1pt solid #e5e7eb;
    }

    .description p {
      margin-top: 2mm;
      color: #4b5563;
      white-space: pre-wrap;
    }

    .footer {
      margin-top: 15mm;
      padding-top: 5mm;
      border-top: 1pt solid #e5e7eb;
      text-align: center;
      font-size: 8pt;
      color: #6b7280;
    }

    .footer .contact {
      margin-top: 2mm;
    }

    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }

      .document {
        padding: 10mm;
      }

      .page-break-before {
        page-break-before: always;
      }
    }

    @page {
      size: A4;
      margin: 15mm;
    }
  `;
}

/**
 * Export activity timeline to PDF
 */
export function exportActivityToPDF(activities: ActivityItem[], profile: UserProfile) {
  // Similar implementation for activity timeline
  const printDiv = document.createElement("div");
  printDiv.style.display = "none";

  const html = `
    <div class="document">
      <header class="header">
        <div class="logo">
          <h1>BâtirNet</h1>
          <p class="tagline">Historique d'activité</p>
        </div>
        <div class="export-info">
          <p><strong>Exporté le:</strong> ${format(new Date(), "d MMMM yyyy 'à' HH:mm", {
            locale: fr,
          })}</p>
          <p><strong>Client:</strong> ${profile.full_name}</p>
        </div>
      </header>

      <div class="content">
        <h2>Activité Récente (${activities.length})</h2>
        ${activities
          .map(
            (activity) => `
          <div class="activity-item">
            <div class="activity-header">
              <strong>${activity.title}</strong>
              <span class="timestamp">${format(new Date(activity.timestamp), "d MMM yyyy HH:mm", { locale: fr })}</span>
            </div>
            <p>${activity.description}</p>
          </div>
        `
          )
          .join("")}
      </div>

      <footer class="footer">
        <p>Document généré par BâtirNet</p>
      </footer>
    </div>
  `;

  // SECURITY: Sanitize HTML before injection to prevent XSS
  const sanitizedHTML = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'div', 'p', 'span', 'h1', 'h2', 'h3', 'strong', 'em', 'ul', 'ol', 'li',
      'header', 'footer', 'section'
    ],
    ALLOWED_ATTR: ['class', 'style', 'id'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link', 'style'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'onblur']
  });

  printDiv.innerHTML = sanitizedHTML;
  document.body.appendChild(printDiv);

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Veuillez autoriser les pop-ups pour exporter en PDF");
    document.body.removeChild(printDiv);
    return;
  }

  // SECURITY: Use sanitized HTML in document.write
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Historique d'activité - BâtirNet</title>
        <style>${getPrintStyles()}</style>
      </head>
      <body>${sanitizedHTML}</body>
    </html>
  `);

  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
    printWindow.onafterprint = () => {
      printWindow.close();
      document.body.removeChild(printDiv);
    };
  };
}

