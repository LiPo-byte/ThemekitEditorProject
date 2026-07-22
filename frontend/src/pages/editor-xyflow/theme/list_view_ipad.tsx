import ThemeIpadHomePreview from './ThemeIpadHomePreview';

export default function ListViewIpad(props: any) {
  return (
    <ThemeIpadHomePreview
      data={props.data}
      defaultWidth={1024}
      defaultHeight={1366}
      cols={4}
      rows={4}
      chromeScale={0.5}
    />
  );
}
