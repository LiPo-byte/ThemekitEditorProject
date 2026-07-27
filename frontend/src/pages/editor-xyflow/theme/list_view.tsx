import ThemeHomePreview from './ThemeHomePreview';

export default function ListView(props: any) {
  return (
    <ThemeHomePreview
      nodeId={props.id}
      data={props.data}
      defaultWidth={984}
      defaultHeight={2130}
      cols={4}
      rows={6}
    />
  );
}
