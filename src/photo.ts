import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

export interface PickedPhoto {
  uri: string;
  base64: string; // JPEG
}

export class CameraDeniedError extends Error {}

const MAX_SIDE = 1024; // больше не нужно для распознавания, а файл и цена запроса меньше

export async function pickFoodPhoto(source: 'camera' | 'library'): Promise<PickedPhoto | null> {
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
  let result: ImagePicker.ImagePickerResult;
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new CameraDeniedError();
    result = await ImagePicker.launchCameraAsync(options);
  } else {
    result = await ImagePicker.launchImageLibraryAsync(options);
  }
  const asset = result.canceled ? null : result.assets[0];
  if (!asset) return null;

  let context = ImageManipulator.manipulate(asset.uri);
  if (!asset.width || !asset.height || Math.max(asset.width, asset.height) > MAX_SIDE) {
    context = context.resize(asset.width >= asset.height ? { width: MAX_SIDE } : { height: MAX_SIDE });
  }
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ base64: true, compress: 0.7, format: SaveFormat.JPEG });
  if (!saved.base64) return null;
  return { uri: saved.uri, base64: saved.base64.replace(/^data:image\/\w+;base64,/, '') };
}
