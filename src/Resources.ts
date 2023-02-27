import { FileLoader, Object3D, Texture, TextureLoader } from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export enum FileType {
  GLTF = "gltf",
  Texture = "texture",
  Shader = "shader"
}

const gltfLoader = new GLTFLoader();
const textureLoader = new TextureLoader();
const fileLoader = new FileLoader();
fileLoader.setResponseType("text");

const loaderTypeEnum = {
  [FileType.GLTF] : gltfLoader,
  [FileType.Texture] : textureLoader,
  [FileType.Shader] : fileLoader,
} as const;

type GetTransformTypeFromFiletype<T extends FileType> = Awaited<ReturnType<((typeof loaderTypeEnum)[T])['loadAsync']>>;
const resources = {};

export function get<F extends FileType, T = GetTransformTypeFromFiletype<F>>(resource: Resource<F, T>) : T {
  return resources[resource.location];
}

type Resource<T extends FileType, K = GetTransformTypeFromFiletype<T>> = {
  type: T
  location: string,
  transform: (input: GetTransformTypeFromFiletype<T>) => K
  get: () => K
}

type GLTFFileExtensions = ".glb" | ".gltf"
type GLTFFile<Name extends string> = `${Name}${GLTFFileExtensions}`;
type PostProcessor<From, To> = (input: From) => To;

type TextureFileExtensions = ".png" | ".jpg" | ".jpeg";
type TextureFile<Name extends string> = `${Name}${TextureFileExtensions}`;

type ShaderFileExtensions = ".glsl" | ".vert" | ".frag";
type ShaderFile<Name extends string> = `${Name}${ShaderFileExtensions}`;

const extensionToFileTypeMap = {
  [FileType.Texture]: ["png", "jpg", "jpeg"],
  [FileType.GLTF]: ["glb", "gltf"],
  [FileType.Shader]: ["glsl", "vert", "frag"],
};

function fileLocationToFileType(location: string) : FileType {
  const extension = location.split(".")[1];
  const result = Object.entries(extensionToFileTypeMap).find(([key, value]) => {
    return value.includes(extension)
  });
  if(!(result)) {
    throw new Error("I don't know what type of file this is: \n\t" + location);
  }
  return result[0] as FileType;
}

export class Resources {

  private static filesToLoad : Resource<FileType>[] = []

  static add<Name extends string, T = string>(location : ShaderFile<Name>, transform?: PostProcessor<string, T>) : Resource<FileType.Shader, T>
  static add<Name extends string, T = GLTF>(location : GLTFFile<Name>, transform?: PostProcessor<GLTF, T>) : Resource<FileType.GLTF, T>
  static add<Name extends string, T = Texture>(location : TextureFile<Name>, transform?: PostProcessor<Texture, T>) : Resource<FileType.Texture, T>
  static add<Name extends string>(location : Name, transform: PostProcessor<any, any>) : Resource<FileType, any> {
    const resource = {
      location, 
      type: fileLocationToFileType(location),
      transform,
      get() {
        throw new Error("Attempting to `get()` " + location + " before it is loaded.");
      }
    };
    Resources.filesToLoad.push(resource);
    return resource;
  }

  static loadAll() {
    // First, we load all the files as usual:
    const promises = Resources.filesToLoad.map((resource) => {
      return new Promise<Resource<FileType>>((resolve) => {
        let loader = loaderTypeEnum[resource.type];
        loader.load(resource.location, (obj) => {
          console.log("Loaded " + resource.location)
          resource.get = () => {
            return obj
          }
          resources[resource.location] = obj;
          resolve(resource);
        }); 
      });
    });

    return Promise.all(promises).then((resources) => {
      resources.forEach(resource => {
        if(resource.transform) {
          console.log("Transforming " + resource.location);
          const obj = resource.transform(resource.get());
          resource.get = () => obj;
        }
      });   
    })   
  }
}