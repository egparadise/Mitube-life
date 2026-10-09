// CSS / CSS Module import 에 대한 타입 선언 (번들러가 처리, tsc 용 declaration).
declare module '*.css';

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}
