# 锁屏组件导出规则总结

来源：`widget/rule_ymal/resource-validation/lock_screen_*.yml`（29 个）+ `lockpack.yml`（1 个）。
本文只做归纳，规则以 yml 为准；yml 改了要回来同步。

## 0. 一句话结论

29 个 `lock_screen_*.yml` 与编辑器的 29 个节点 type（`lock_{name}_{shape}_{variant}`）**一一对应**，
所以导出规则表可以直接用节点 type 作 key，不用再按 type + size + layoutType 拼三层判断。

每份 yml 分 4 段：`required_files`（必须存在的文件）、`file_rules`（每个文件的宽高/格式）、
`json_template`（widgets_spec.json 必填字段）、`json_value_checks`（字段取值约束）。

## 1. 两层校验

| 层 | 规则文件 | 校验对象 |
| --- | --- | --- |
| 整包 | `lockpack.yml` | 一个 LockPack = 整包预览图 + 单张壁纸 + 1~N 套锁屏组件 |
| 单组件 | `lock_screen_*.yml` | 一套锁屏组件的资源 + `widgets_spec.json` |

### LockPack 整包（`lockpack.yml`）

| 文件 | 宽×高 | 格式 |
| --- | --- | --- |
| `preview_long.jpg` | 887×1920 | jpg |
| `preview_short.jpg` | 887×1578 | jpg |
| `list_view.jpg` | 492×1065 | jpg |
| `wallpaper.jpg` | 887×1920 | jpg |

- LockPack **不含 icon**，壁纸固定单张 `wallpaper.jpg`。
- 组件套数 `multiple: auto`，按 spec 文件名自动判定：
  - 单套：`widgets_spec.json`，资源名无数字后缀。
  - 多套：`widgets_spec_1.json` / `widgets_spec_2.json`，资源名带 `_1` / `_2`（如 `image_cloud_1.png`、`widgets_rectangle_weather_preview_1.jpg`）。

## 2. 通用约定

### 尺寸体系

素材按 @3x 出图，`size` 常量与画布点值的换算见 `base-config.ts` 的 `LOCK_ASSET_SCALE`。

| `size` | 形状 | 素材/预览尺寸 | yml 文件名后缀 |
| --- | --- | --- | --- |
| 1001 | circle | 186×186 | `_size_0` |
| 1002 | rect | 465×186 | `_size_1` |
| 1003 | inline | 732×69 | `_size_3` |

注意 yml 文件名里的 `size_0/1/3` 与 config 里的 `1001/1002/1003` 是两套编号。

### 预览图命名

每套组件都要 **两张** 预览，宽高等于该形状的素材尺寸：

```
widgets_{shape}_{token}_preview.{ext}              # 带背景
widgets_{shape}_{token}_previewTransParent.{ext}   # 透明底
```

`shape` 取 `circular` / `rectangle` / `inline`。`token` 按组件类型取：

| type | circle | rect | inline |
| --- | --- | --- | --- |
| 1001 Battery | — | `battery` | — |
| 1002 Calendar | — | `calendar` | — |
| 1004 Weather | `weather` | `weather` | — |
| 1005 Dynamic | `dynamic` | `static` | — |
| 1006 Static | `pattern` | `pattern` | — |
| 1007 CountDown | — | `count_down` | — |
| 1008 Quotation | — | `quotation` | — |
| 1009 Health | `health` | `health` | `health` |
| 1010 Launcher | `launcher` | `launcher` | — |
| 1011 Custom InLine | — | — | `customtext` |

**token 有两处不直觉，按 yml 原样实现，别按类型名推**：

- 1005 Dynamic 的 **rect** 用 `static`（`widgets_rectangle_static_preview.gif`），circle 才用 `dynamic`。
- 1006 Static 用 `pattern`，不是 `static`。

### 预览图格式

默认 `preview` 是 jpg、`previewTransParent` 是 png。两个例外：

- **1005 Dynamic**：两张都是 **gif**。
- **1010 Launcher circle**：`widgets_circular_launcher_preview.png` 也是 **png**。

### widgets_spec.json 通用约束

- 顶层必填：`version`、`isLockScreen`、`type`、`sizes`。
- `isLockScreen` 必须为 `true`；`type` 必须等于该规则的类型号。
- `sizes` 是数组，且 **`min_length: 1` / `max_length: 1`** —— 一份 spec 只装一个尺寸。
- `allow_extra_fields: true`，多余字段不报错，缺必填字段报错。
- 所有 `textSize` / `textHeight` 必须是非负整数（`^(0|[1-9]\d*)$`）。

## 3. 逐类型清单

下表的「素材」不含 `widgets_spec.json` 和两张预览图（每套都有，见上）。
「spec 字段」指 `sizes[0]` 里的必填字段，文本字段默认含 `font` / `textSize` / `textHeight`。

### 1001 Battery — rect

判定：`type == 1001`，`size ∈ {1002}`

| 素材 | 宽×高 |
| --- | --- |
| `image_battery_rectangle.png` | 36×36 |
| `image_charging_icon_rectangle.png` | 186×186 |
| `image_empty_ring_rectangle.png` | 186×186 |

spec 字段：`size` `name` `title` `percent` `isCharging` `mode`

### 1002 Calendar — rect

判定：`type == 1002`，`size ∈ {1002}`

| 素材 | 宽×高 |
| --- | --- |
| `image_calendar_rectangle.png` | 186×186 |

spec 字段：`size` `name` `title` `date` `weekday` `calendar`
额外约束：`calendar.textAlignment ∈ {1, 2, 3}`

### 1004 Weather — circle ×4 / rect ×6

判定：`type == 1004 && weatherType == N`。天气图标全部 **42×42 png**，
但**每个变体要哪几张不一样**，多传少传都算不过：

| 变体 | cloud | rain | snow | sun | temp | thunder | wind | 共 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| w1 circle | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 7 |
| w1 rect | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ | 6 |
| w2 circle | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ | 6 |
| w2 rect | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | | 6 |
| w3 circle | | | | | | | | 0 |
| w3 rect | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ | 6 |
| w4 circle | | | | | | | | 0 |
| w4 rect | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ | 6 |
| w5 rect | | | | | | | | 0 |
| w6 rect | | | | | | | | 0 |

只有 **w1 circle 有 `image_temp.png`**（rect 版没有），而 **w2 反过来**：rect 有 temp、circle 没有，
且 w2 rect 没有 `image_wind.png`。w3/w4 circle 与 w5/w6 rect 只出预览图，不带天气图标。

spec 字段：

- circle：`size` `weatherType` `name` `bottomInfo`
- rect：`size` `weatherType` `name` `topInfo` `bottomInfo`

### 1005 Dynamic — circle / rect

判定：`type == 1005`

要三个 gif（circle 186×186、rect 465×186），但只有两份内容：

| 文件 | 内容 |
| --- | --- |
| `widgets_{circular_dynamic,rectangle_static}_preview.gif` | 截画布上的组件，带卡片背景 |
| `widgets_{circular_dynamic,rectangle_static}_previewTransParent.gif` | 上传的 `image_dynamics_gif` 原图透传 |
| `{sizes[].fileName}.gif` | 同上，同一份 blob 换个名字 |

上传的 gif 本身就是透明底，所以它直接当透明底预览用。透传不重编码也是必须的：
gif 只支持 1 bit 索引透明，`gif.js` 重新编码会把透明区压成黑底。

`{fileName}.gif` 的名字随主题变，yml 里不在 `required_files`，而是用 `file_references`
校验 `sizes[*].fileName` + `.gif` 存在且尺寸正确，所以规则表里这条的 `name` 是个函数。

spec 字段：`size` `name` `fileName`（`name` / `fileName` 均为字符串）

### 1006 Static — circle / rect

判定：`type == 1006`

| 形状 | 素材 | 宽×高 |
| --- | --- | --- |
| circle | `image_static_circular.png` | 186×186 |
| rect | `image_static_rectangle.png` | 465×186 |

spec 字段：`size` `name`

### 1007 CountDown — rect，分 DIY / 非 DIY

判定：`type == 1007`，靠 `canBeCustomised` 区分（不是 `layoutType`）。

| 变体 | 判定 | 素材 |
| --- | --- | --- |
| nodiy | `canBeCustomised == 0` | `image_count_down_rectangular.png` 129×126 |
| diy layout0 | `canBeCustomised == 1 && layoutType == 0` | 无 |
| diy layout1 | `canBeCustomised == 1 && layoutType == 1` | 无 |

spec 字段：

- nodiy：`size` `name` `canBeCustomised` `festivalName` `title` `days` `remainDays`
- diy：`size` `name` `canBeCustomised` `layoutType` `title` `remainDays`

`festivalName` 是 22 项枚举：`Easter` `Thanksgiving` `St.Patrick's Day` `Valentine's Day`
`April Fool's Day` `Halloween` `Mother's Day` `Christmas` `NewYear` `Lincoln's Birthday`
`Presidents' Day` `Arbor Day` `Memorial Day` `Flag Day` `Independence Day`
`International Kissing Day` `World Chocolate Day` `World Teachers' Day` `Veteran's Day`
`Father's Day` `Labor Day` `Columbus Day` `Black Friday`

`title.content` 必须是字符串。

### 1008 Quotation — rect

判定：`type == 1008`

无素材，只有两张预览图。

spec 字段：`size` `name` `canBeCustomised`（∈ {0, 1}）`numberOfLines` `title`（含 `content`）

### 1009 Health — circle ×3 / rect ×2 / inline ×1

判定：`type == 1009 && layoutType == N`

每个变体都要 `image_health.png` + 一张对应形状的底图，**`image_health.png` 的尺寸每个变体都不同**：

| 变体 | `image_health.png` | 底图 | 底图尺寸 |
| --- | --- | --- | --- |
| layout0 circle | 60×69 | `image_static_circular.png` | 186×186 |
| layout0 rect | 24×48 | `image_static_rectangle.png` | 465×186 |
| layout0 inline | 51×45 | `image_static_inline.png` | 732×69 |
| layout1 circle | 60×60 | `image_static_circular.png` | 186×186 |
| layout1 rect | 78×72 | `image_static_rectangle.png` | 465×186 |
| layout2 circle | 60×60 | `image_static_circular.png` | 186×186 |

spec 字段：`size` `name` `layoutType`

### 1010 Launcher — circle / rect

判定：`type == 1010`

| 形状 | 素材 | 宽×高 | 预览格式 |
| --- | --- | --- | --- |
| circle | `image_launcher_circular.png` | 108×108 | preview 也是 **png** |
| rect | `image_launcher_rectangle.png` | 102×102 | preview jpg |

spec 字段：

- circle：`size` `name` `appLinks`
- rect：`size` `name` `title` `appLinks`

`appLinks[*]` 必须是 int。

### 1011 Custom InLine — inline

判定：`type == 1011`

无素材，只有两张预览图（732×69）。

spec 字段：`size` `name` `layoutType`（固定 0）`numberOfLines`（固定 1）`title`（含 `content`）

## 4. 与当前编辑器实现的差异

写导出逻辑前需要确认这几条：

1. **一份 spec 只能有一个 size**（`max_length: 1`），但编辑器里一个 lockwidget 根节点下可以挂多个尺寸子节点，
   `buildLockWidgetElementPayload` 也是把它们合成一个 `sizes` 数组存后端。
   导出时必须**按尺寸节点拆包**：每个尺寸一份 `widgets_spec.json` + 自己的资源；
   同一个包里多套时按 `lockpack.yml` 的约定加 `_1` / `_2` 后缀。

2. `image_static_inline` **不在** `base-config.ts` 的 `LOCK_IMAGE_FIELD_KEYS` 里，
   health inline 变体的底图目前在右侧属性面板没有上传入口。

3. `image_count_down_rectangular_customised` 在 `LOCK_IMAGE_FIELD_KEYS` 里，
   但 countdown 的两个 diy 规则都不要求任何图片素材，这个字段可能是多余的。

4. `image_dynamics_gif` 在 `LOCK_IMAGE_FIELD_KEYS` 里，而 dynamic 规则的 `required_files`
   只有两张 gif 预览、没有 `image_dynamics_gif.gif`：上传的 GIF 是直接当透明底预览
   和 `{fileName}.gif` 导出的，见上面 1005 那节。透传出去的尺寸没人校验，
   上传时没拦住不合规尺寸的话，导出的包会在客户端侧校验失败。

5. 天气图标 `LOCK_WEATHER_ICON_KEYS` 是 7 个的全集，实际每个变体只要其中一个子集（见上表），
   导出时要按变体过滤，不能整套输出。
