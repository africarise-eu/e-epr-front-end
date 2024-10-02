export interface ErrorDetailDto {
    message: string;
    path: (string | number)[];
  }
  
export interface ErrorsDto {
    [key: string]: string;
  }