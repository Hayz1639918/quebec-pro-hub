import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Calendar,
  DollarSign,
  Eye,
  MapPin,
  MessageSquare,
  MoreVertical,
  Pencil,
  Trash2,
  ExternalLink,
  FileText,
} from "lucide-react";

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  budget_min: number | null;
  budget_max: number | null;
  city: string | null;
  region: string | null;
  status: "open" | "in_progress" | "completed" | "cancelled";
  deadline: string | null;
  created_at: string;
  proposals_count: number;
  views_count: number;
}

interface ProjectListProps {
  projects: Project[];
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  onView?: (id: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  open: "Ouvert",
  in_progress: "En cours",
  completed: "Complété",
  cancelled: "Annulé",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-green-100 text-green-800 border-green-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-gray-100 text-gray-800 border-gray-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

export default function ProjectList({ projects, onDelete, onEdit, onView }: ProjectListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  const STATUS_LABELS: Record<string, string> = {
    open: t('projects.status.open'),
    in_progress: t('projects.status.in_progress'),
    completed: t('projects.status.completed'),
    cancelled: t('projects.status.cancelled'),
  };

  const handleDeleteClick = (id: string) => {
    setSelectedProjectId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedProjectId && onDelete) {
      onDelete(selectedProjectId);
    }
    setDeleteDialogOpen(false);
    setSelectedProjectId(null);
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return t('projects.to_discuss');
    if (min && max) return `${min.toLocaleString()} $ - ${max.toLocaleString()} $`;
    if (min) return `${t('projects.from')} ${min.toLocaleString()} $`;
    if (max) return `${t('projects.up_to')} ${max.toLocaleString()} $`;
    return t('projects.to_discuss');
  };

  if (projects.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-4">
        {/* Desktop View - Table */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('dashboard.project_list.project')}</TableHead>
                <TableHead>{t('dashboard.project_list.status')}</TableHead>
                <TableHead>{t('dashboard.project_list.budget')}</TableHead>
                <TableHead>{t('dashboard.project_list.location')}</TableHead>
                <TableHead>{t('dashboard.project_list.proposals')}</TableHead>
                <TableHead>{t('dashboard.project_list.views')}</TableHead>
                <TableHead>{t('dashboard.project_list.date')}</TableHead>
                <TableHead className="text-right">{t('dashboard.project_list.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{project.title}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {project.description}
                      </div>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {project.category}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[project.status]} variant="outline">
                      {STATUS_LABELS[project.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <DollarSign className="h-3 w-3" />
                      {formatBudget(project.budget_min, project.budget_max)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {project.city && project.region ? (
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        {project.city}, {project.region}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Non spécifié</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{project.proposals_count}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span>{project.views_count}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(project.created_at), "d MMM yyyy", { locale: fr })}
                    </div>
                    {project.deadline && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        {t('dashboard.project_list.deadline')}: {format(new Date(project.deadline), "d MMM yyyy", { locale: fr })}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t('dashboard.project_list.actions')}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {onView && (
                          <DropdownMenuItem onClick={() => onView(project.id)}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            {t('dashboard.project_list.view_details')}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => navigate(`/tender/${project.id}?showPDF=true`)}>
                          <FileText className="mr-2 h-4 w-4" />
                          Voir l'appel d'offres (PDF)
                        </DropdownMenuItem>
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(project.id)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {t('dashboard.project_list.edit')}
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(project.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t('dashboard.project_list.delete')}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View - Cards */}
        <div className="md:hidden space-y-4">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {project.description}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {onView && (
                        <DropdownMenuItem onClick={() => onView(project.id)}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Voir les détails
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => navigate(`/tender/${project.id}?showPDF=true`)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Voir l'appel d'offres (PDF)
                      </DropdownMenuItem>
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(project.id)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(project.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className={STATUS_COLORS[project.status]} variant="outline">
                      {STATUS_LABELS[project.status]}
                    </Badge>
                    <Badge variant="outline">{project.category}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground mb-1">Budget</div>
                      <div className="font-medium flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {formatBudget(project.budget_min, project.budget_max)}
                      </div>
                    </div>
                    {project.city && (
                      <div>
                        <div className="text-muted-foreground mb-1">Localisation</div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {project.city}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span>{project.proposals_count} proposition(s)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span>{project.views_count} vue(s)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {t('dashboard.project_list.created_on')} {format(new Date(project.created_at), "d MMM yyyy", { locale: fr })}
                    </div>
                    {project.deadline && (
                      <div>
                        Échéance: {format(new Date(project.deadline), "d MMM", { locale: fr })}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dashboard.project_list.delete_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dashboard.project_list.delete_description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('dashboard.project_list.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

