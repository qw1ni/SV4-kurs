import { useRef, useState } from 'react';
import { Badge, Box, CircularProgress, IconButton, Stack, Tooltip } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import DeleteIcon from '@mui/icons-material/Delete';
import { employeesApi } from '@/api/employees.api';
import { extractErrorMessage } from '@/api/client';
import { useAppDispatch } from '@/app/hooks';
import { showSnackbar } from '@/features/ui/uiSlice';
import { EmployeeAvatar } from './EmployeeAvatar';

interface Props {
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    photoUrl?: string | null;
  };
  size?: number;
  onChange: (photoUrl: string | null) => void;
}

export function AvatarUploader({ employee, size = 96, onChange }: Props) {
  const dispatch = useAppDispatch();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const pickFile = () => inputRef.current?.click();

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // позволяет загрузить тот же файл повторно
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      dispatch(showSnackbar({ message: 'Файл больше 5 МБ', severity: 'error' }));
      return;
    }
    setUploading(true);
    try {
      const res = await employeesApi.uploadPhoto(employee.id, file);
      onChange(res.photoUrl);
      dispatch(showSnackbar({ message: 'Фото обновлено', severity: 'success' }));
    } catch (err) {
      dispatch(showSnackbar({ message: extractErrorMessage(err), severity: 'error' }));
    } finally {
      setUploading(false);
    }
  };

  const remove = async () => {
    setUploading(true);
    try {
      await employeesApi.deletePhoto(employee.id);
      onChange(null);
      dispatch(showSnackbar({ message: 'Фото удалено', severity: 'info' }));
    } catch (err) {
      dispatch(showSnackbar({ message: extractErrorMessage(err), severity: 'error' }));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Stack alignItems="center" spacing={1}>
      <Box sx={{ position: 'relative', width: size, height: size }}>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          badgeContent={
            <Tooltip title="Загрузить фото">
              <IconButton
                size="small"
                onClick={pickFile}
                disabled={uploading}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': { bgcolor: 'primary.dark' },
                  width: 32,
                  height: 32,
                }}
              >
                <PhotoCameraIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          }
        >
          <EmployeeAvatar
            employee={employee}
            sx={{ width: size, height: size, fontSize: size / 3 }}
          />
        </Badge>
        {uploading && (
          <CircularProgress
            size={size}
            sx={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
          />
        )}
      </Box>
      {employee.photoUrl && (
        <Tooltip title="Удалить фото">
          <IconButton size="small" color="error" onClick={remove} disabled={uploading}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        onChange={handleFile}
      />
    </Stack>
  );
}
