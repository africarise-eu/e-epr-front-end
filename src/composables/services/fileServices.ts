
import type{FileModel} from '@/composables/filemodel';

async function convertFileModelsToFiles(fileModels: FileModel[]): Promise<File[]> {
    const filePromises = fileModels.map(fileModel => fileModelToFile(fileModel));
    return Promise.all(filePromises);
}

function fileModelToFile(fileModel: FileModel): Promise<File> {
    return fetch(fileModel.url || '')
      .then(response => response.blob())
      .then(blob => {
        return new File([blob], fileModel.name || 'unknown', { type: fileModel.status || 'application/octet-stream' });
      });
}

export { convertFileModelsToFiles };