import { useCallback, useEffect, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FolderIcon from '@mui/icons-material/Folder';
import ViewListIcon from '@mui/icons-material/ViewList';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import { PageHeader } from '@/components/common/PageHeader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { departmentsApi } from '@/api/departments.api';
import type { DepartmentDto } from '@/types/models';
import { useAppDispatch } from '@/app/hooks';
import { showSnackbar } from '@/features/ui/uiSlice';

function DepartmentTreeNode({
  node,
  level,
  onEdit,
  onDelete,
}: {
  node: DepartmentDto;
  level: number;
  onEdit: (d: DepartmentDto) => void;
  onDelete: (d: DepartmentDto) => void;
}) {
  const hasChildren = (node.children?.length ?? 0) > 0;
  return (
    <Accordion defaultExpanded={level < 2} disableGutters elevation={0} sx={{ '&:before': { display: 'none' } }}>
      <AccordionSummary expandIcon={hasChildren ? <ExpandMoreIcon /> : null} sx={{ pl: level * 2 + 1 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1 }}>
          <FolderIcon color="primary" />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {node.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {node.code}
              {node._count && ` · ${node._count.staffUnits} шт. ед.`}
            </Typography>
          </Box>
          <Tooltip title="Редактировать">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(node); }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Удалить">
            <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); onDelete(node); }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </AccordionSummary>
      {hasChildren && (
        <AccordionDetails sx={{ p: 0 }}>
          {node.children!.map((child) => (
            <DepartmentTreeNode key={child.id} node={child} level={level + 1} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </AccordionDetails>
      )}
    </Accordion>
  );
}

export function DepartmentsPage() {
  const dispatch = useAppDispatch();
  const [view, setView] = useState<'tree' | 'list'>('tree');
  const [tree, setTree] = useState<DepartmentDto[]>([]);
  const [list, setList] = useState<DepartmentDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<DepartmentDto | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<DepartmentDto | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, l] = await Promise.all([
        departmentsApi.tree(),
        departmentsApi.list(search || undefined),
      ]);
      setTree(t);
      setList(l);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Box>
      <PageHeader
        title="Подразделения"
        subtitle="Иерархическая структура организации"
        crumbs={[{ label: 'Подразделения' }]}
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Добавить
          </Button>
        }
      />

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              size="small"
              label="Поиск"
              fullWidth
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <ToggleButtonGroup
              value={view}
              exclusive
              size="small"
              onChange={(_, v) => v && setView(v)}
            >
              <ToggleButton value="tree">
                <AccountTreeIcon sx={{ mr: 0.5 }} fontSize="small" /> Дерево
              </ToggleButton>
              <ToggleButton value="list">
                <ViewListIcon sx={{ mr: 0.5 }} fontSize="small" /> Список
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : view === 'tree' ? (
            tree.length === 0 ? (
              <Typography color="text.secondary">Подразделения не добавлены</Typography>
            ) : (
              tree.map((root) => (
                <DepartmentTreeNode
                  key={root.id}
                  node={root}
                  level={0}
                  onEdit={(d) => {
                    setEditing(d);
                    setFormOpen(true);
                  }}
                  onDelete={setDeleting}
                />
              ))
            )
          ) : (
            <Grid container spacing={2}>
              {list.map((d) => (
                <Grid key={d.id} item xs={12} sm={6} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {d.name}
                          </Typography>
                          <Chip size="small" label={d.code} sx={{ mt: 0.5 }} />
                        </Box>
                        <Box>
                          <IconButton size="small" onClick={() => { setEditing(d); setFormOpen(true); }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => setDeleting(d)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Stack>
                      {d.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {d.description}
                        </Typography>
                      )}
                      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                        <Badge badgeContent={d._count?.staffUnits ?? 0} color="primary" max={999}>
                          <Chip size="small" label="Штатных единиц" variant="outlined" />
                        </Badge>
                        {d.parent && (
                          <Chip size="small" label={`в составе: ${d.parent.name}`} variant="outlined" />
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>

      <DepartmentFormDialog
        open={formOpen}
        editing={editing}
        allDepartments={list}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          dispatch(showSnackbar({ message: editing ? 'Обновлено' : 'Создано', severity: 'success' }));
          void load();
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        title="Удалить подразделение?"
        message={`Подразделение «${deleting?.name}» будет удалено. Подчинённые подразделения отвяжутся от родителя.`}
        confirmText="Удалить"
        destructive
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await departmentsApi.remove(deleting.id);
            dispatch(showSnackbar({ message: 'Удалено', severity: 'info' }));
            void load();
          } catch {
            dispatch(showSnackbar({ message: 'Не удалось удалить (есть штатные единицы)', severity: 'error' }));
          }
        }}
      />
    </Box>
  );
}

function DepartmentFormDialog({
  open,
  editing,
  allDepartments,
  onClose,
  onSaved,
}: {
  open: boolean;
  editing: DepartmentDto | null;
  allDepartments: DepartmentDto[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<number | ''>('');

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? '');
      setCode(editing?.code ?? '');
      setDescription(editing?.description ?? '');
      setParentId(editing?.parentId ?? '');
    }
  }, [open, editing]);

  const submit = async () => {
    if (!name || !code) return;
    const payload = {
      name,
      code,
      description: description || null,
      parentId: parentId === '' ? null : Number(parentId),
    };
    if (editing) {
      await departmentsApi.update(editing.id, payload);
    } else {
      await departmentsApi.create(payload);
    }
    onSaved();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editing ? 'Редактирование подразделения' : 'Новое подразделение'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField
            label="Название"
            required
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            label="Код"
            required
            fullWidth
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            helperText="Уникальный идентификатор (например, IT-DEV)"
          />
          <TextField
            label="Описание"
            fullWidth
            multiline
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <TextField
            select
            label="Родительское подразделение"
            fullWidth
            value={parentId}
            onChange={(e) => setParentId(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <MenuItem value="">— Корневое —</MenuItem>
            {allDepartments
              .filter((d) => d.id !== editing?.id)
              .map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.name}
                </MenuItem>
              ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button variant="contained" onClick={submit}>
          {editing ? 'Сохранить' : 'Создать'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
