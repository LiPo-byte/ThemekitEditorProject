import ThemeHomePreview from './ThemeHomePreview';

export default function PreviewLong(props: any) {
  return (
    <ThemeHomePreview
      data={props.data}
      defaultWidth={887}
      defaultHeight={1920}
      cols={4}
      rows={6}
    />
  );
}
