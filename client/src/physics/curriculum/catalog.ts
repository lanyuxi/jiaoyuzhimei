import type {
  CurriculumFilters,
  ExperimentActivityType,
  ExperimentRequirement,
  MeasurementDefinition,
  TextbookPhysicsExperiment,
  TextbookVolume,
} from './types'

const requiredSourceTypes = new Set([
  '基础技能·建议必做',
  '基础技能·必做',
  '测量·建议必做',
  '测量·必做',
  '探究·必做',
])

const activityTypeByPrefix = {
  基础技能: '基础技能',
  测量: '测量',
  探究: '探究',
  演示: '演示',
  模型: '模型',
} as const

function requirementFromSource(sourceType: string): ExperimentRequirement {
  return requiredSourceTypes.has(sourceType) ? 'required' : 'optional'
}

function activityTypeFromSource(sourceType: string): ExperimentActivityType {
  const prefix = sourceType.split(/[·/]/)[0] as keyof typeof activityTypeByPrefix
  return activityTypeByPrefix[prefix]
}

const raw = (key: string, label: string, unit: string, decimals?: number): MeasurementDefinition => ({
  key,
  label,
  unit,
  kind: 'raw',
  decimals,
})

const derived = (key: string, label: string, unit: string, decimals?: number): MeasurementDefinition => ({
  key,
  label,
  unit,
  kind: 'derived',
  decimals,
})

const observation = (key: string, label: string): MeasurementDefinition => ({
  key,
  label,
  unit: '',
  kind: 'observation',
})

const measurementDefinitionsByTitle: Readonly<Record<string, readonly MeasurementDefinition[]>> = {
  '使用刻度尺测长度': [raw('length', '长度', 'cm', 1)],
  '用停表测量时间': [raw('time', '时间', 's', 1)],
  '测量物体运动的平均速度': [raw('distance', '路程', 'm', 2), raw('time', '时间', 's', 1), derived('averageSpeed', '平均速度', 'm/s', 2)],
  '用温度计测量水的温度': [raw('temperature', '水温', '℃', 1)],
  '探究固体熔化时温度的变化规律': [raw('time', '时间', 'min', 1), raw('temperature', '温度', '℃', 1), derived('meltingPoint', '熔点', '℃', 1)],
  '探究水沸腾时温度变化的特点': [raw('time', '时间', 'min', 1), raw('temperature', '温度', '℃', 1), derived('boilingPoint', '沸点', '℃', 1)],
  '探究光的反射规律': [raw('incidenceAngle', '入射角', '°', 1), raw('reflectionAngle', '反射角', '°', 1), derived('angleDifference', '角度差', '°', 1)],
  '探究光从空气斜射入水中的传播特点': [raw('incidenceAngle', '入射角', '°', 1), raw('refractionAngle', '折射角', '°', 1), derived('angleDifference', '角度差', '°', 1)],
  '测量凸透镜的焦距': [raw('focalLength', '焦距', 'cm', 1)],
  '探究凸透镜成像的规律': [raw('objectDistance', '物距', 'cm', 1), raw('imageDistance', '像距', 'cm', 1), derived('magnification', '放大率', '', 2)],
  '探究同种物质的质量与体积的关系': [raw('mass', '质量', 'g', 1), raw('volume', '体积', 'cm³', 1), derived('density', '质量与体积比', 'g/cm³', 2)],
  '测量盐水的密度': [raw('mass', '盐水质量', 'g', 1), raw('volume', '盐水体积', 'cm³', 1), derived('density', '盐水密度', 'g/cm³', 2)],
  '测量小石块的密度': [raw('mass', '石块质量', 'g', 1), raw('volume', '石块体积', 'cm³', 1), derived('density', '石块密度', 'g/cm³', 2)],
  '练习使用弹簧测力计': [raw('force', '拉力', 'N', 2)],
  '探究重力大小跟质量的关系': [raw('mass', '质量', 'kg', 3), raw('gravity', '重力', 'N', 2), derived('gravityFieldStrength', '重力与质量比', 'N/kg', 2)],
  '测量滑动摩擦力': [raw('pullingForce', '拉力', 'N', 2), derived('slidingFriction', '滑动摩擦力', 'N', 2)],
  '探究液体内部压强的特点': [raw('depth', '深度', 'cm', 1), raw('heightDifference', '液面高度差', 'cm', 1), derived('pressureDifference', '压强差', 'Pa', 1)],
  '托里拆利实验': [raw('mercuryHeight', '水银柱高度', 'mm', 1), derived('atmosphericPressure', '大气压强', 'Pa', 0)],
  '探究浮力大小跟哪些因素有关': [raw('gravity', '物体重力', 'N', 2), raw('tension', '拉力', 'N', 2), derived('buoyancy', '浮力', 'N', 2)],
  '探究浮力大小跟排开液体所受重力的关系': [raw('buoyancy', '浮力', 'N', 2), raw('displacedLiquidGravity', '排开液体重力', 'N', 2), derived('difference', '两者差值', 'N', 2)],
  '探究动能大小与哪些因素有关': [raw('mass', '质量', 'g', 1), raw('releaseHeight', '释放高度', 'cm', 1), derived('travelDistance', '木块移动距离', 'cm', 1)],
  '探究重力势能大小与哪些因素有关': [raw('mass', '质量', 'g', 1), raw('height', '高度', 'cm', 1), derived('indentationDepth', '下陷程度', 'cm', 1)],
  '探究杠杆的平衡条件': [raw('effort', '动力', 'N', 2), raw('effortArm', '动力臂', 'cm', 1), raw('load', '阻力', 'N', 2), raw('loadArm', '阻力臂', 'cm', 1), derived('torqueDifference', '力矩差', 'N·cm', 2)],
  '研究定滑轮和动滑轮的特点': [raw('pullingForce', '拉力', 'N', 2), raw('loadDistance', '钩码移动距离', 'cm', 1), raw('ropeDistance', '绳端移动距离', 'cm', 1), derived('mechanicalAdvantage', '机械优势', '', 2)],
  '测量斜面的机械效率': [raw('gravity', '重力', 'N', 2), raw('height', '斜面高度', 'm', 2), raw('pullingForce', '拉力', 'N', 2), raw('distance', '沿面距离', 'm', 2), derived('efficiency', '机械效率', '%', 1)],
  '比较不同物质的吸热能力': [raw('initialTemperature', '初温', '℃', 1), raw('finalTemperature', '末温', '℃', 1), raw('heatingTime', '加热时间', 's', 1), derived('temperatureChange', '温度变化', '℃', 1)],
  '探究串联电路中各处电流的关系': [raw('current1', '第一处电流', 'A', 2), raw('current2', '第二处电流', 'A', 2), derived('currentDifference', '电流差', 'A', 2)],
  '探究并联电路中电流的关系': [raw('mainCurrent', '干路电流', 'A', 2), raw('branchCurrent1', '第一支路电流', 'A', 2), raw('branchCurrent2', '第二支路电流', 'A', 2), derived('currentDifference', '干路与支路电流和之差', 'A', 2)],
  '练习使用电流表': [raw('current', '电流', 'A', 2)],
  '练习使用电压表': [raw('voltage', '电压', 'V', 2)],
  '探究串、并联电路电压的规律': [raw('supplyVoltage', '电源电压', 'V', 2), raw('voltage1', '第一部分电压', 'V', 2), raw('voltage2', '第二部分电压', 'V', 2), derived('voltageDifference', '电压关系差值', 'V', 2)],
  '探究影响导体电阻大小的因素': [raw('current', '电流', 'A', 2), raw('voltage', '电压', 'V', 2), derived('resistance', '电阻', 'Ω', 2)],
  '练习使用滑动变阻器': [raw('current', '电流', 'A', 2), raw('resistance', '接入电阻', 'Ω', 1)],
  '探究电流与电压、电阻的关系': [raw('voltage', '电压', 'V', 2), raw('current', '电流', 'A', 2), raw('resistance', '电阻', 'Ω', 1), derived('resistanceRatio', '电压与电流比', 'Ω', 2)],
  '伏安法测量定值电阻': [raw('voltage', '电压', 'V', 2), raw('current', '电流', 'A', 2), derived('resistance', '电阻', 'Ω', 2)],
  '测量小灯泡的电功率': [raw('voltage', '电压', 'V', 2), raw('current', '电流', 'A', 2), derived('power', '电功率', 'W', 2)],
  '探究电流的热效应': [raw('current', '电流', 'A', 2), raw('resistance', '电阻', 'Ω', 1), raw('time', '通电时间', 's', 1), derived('heat', '热量', 'J', 1)],
  '探究影响电磁铁磁性强弱的因素': [raw('current', '电流', 'A', 2), raw('turns', '线圈匝数', '匝', 0), derived('pins', '吸引大头针数量', '个', 0)],
}

function measurementsFor(title: string): readonly MeasurementDefinition[] {
  return measurementDefinitionsByTitle[title] ?? [observation('observation', '实验现象')]
}

interface WorkbookExperiment {
  sourceNumber: number
  id: string
  volume: TextbookVolume
  chapter: string
  sourceType: string
  title: string
  purpose: string
  principle: string
  apparatus: string
  steps: string
  conclusion: string
  supplement: string
}

function experiment(row: WorkbookExperiment): TextbookPhysicsExperiment {
  return {
    ...row,
    textbook: '人教版',
    requirement: requirementFromSource(row.sourceType),
    activityType: activityTypeFromSource(row.sourceType),
    purpose: [row.purpose],
    principle: [row.principle],
    apparatus: row.apparatus.split('、'),
    steps: [row.steps],
    conclusion: [row.conclusion],
    supplement: [row.supplement],
    measurements: measurementsFor(row.title),
    availability: 'scheduled',
  }
}

const workbookExperiments: readonly WorkbookExperiment[] = [
  { sourceNumber: 1, id: 'ruler-length-measurement', volume: '八年级上册', chapter: '第1章 机械运动', sourceType: '基础技能·建议必做', title: '使用刻度尺测长度', purpose: '学会正确测量长度并估读', principle: '测量值由准确值和估读值组成；多次测量取平均值可减小随机误差', apparatus: '刻度尺、待测物体', steps: '观察量程与分度值→尺边贴近并与被测边平行→视线垂直刻度读数→重复测量取平均', conclusion: '长度测量应估读到分度值下一位，多次测量可减小偶然误差', supplement: '注意零刻度线磨损时改用其他刻度并作差。' },
  { sourceNumber: 2, id: 'stopwatch-time-measurement', volume: '八年级上册', chapter: '第1章 机械运动', sourceType: '基础技能·建议必做', title: '用停表测量时间', purpose: '掌握停表读数与计时方法', principle: '机械停表小表盘读分、大表盘读秒；电子停表直接读数', apparatus: '机械或电子停表', steps: '认识量程和分度值→按启动键开始计时→按停止键读数→复位并复测', conclusion: '读数应包含分钟和秒，计时要从同一时刻开始和结束', supplement: '机械停表先读小盘后读大盘，注意小盘指针所在半格。' },
  { sourceNumber: 3, id: 'average-speed-measurement', volume: '八年级上册', chapter: '第1章 机械运动', sourceType: '探究·必做', title: '测量物体运动的平均速度', purpose: '测量路程和时间并计算平均速度', principle: 'v=s/t；平均速度反映一段路程内的平均快慢', apparatus: '小车、斜面、刻度尺、停表、金属片', steps: '装置让小车从斜面滑下→测量全程及分段路程→记录对应时间→用v=s/t计算并比较', conclusion: '同一运动过程不同路段的平均速度可能不同；下坡小车通常加速', supplement: '斜面坡度宜小，便于计时；释放小车时不应推车。' },
  { sourceNumber: 4, id: 'sound-production', volume: '八年级上册', chapter: '第2章 声现象', sourceType: '演示/选做', title: '探究声音是怎样产生的', purpose: '认识声音由物体振动产生', principle: '发声体振动带动周围介质振动形成声波', apparatus: '音叉、鼓、纸片、橡皮筋或扬声器', steps: '敲击或拨动物体使其发声→观察振动→停止振动→比较是否仍发声', conclusion: '声音由物体振动产生，振动停止，发声停止', supplement: '可用乒乓球或纸屑显示音叉振动。' },
  { sourceNumber: 5, id: 'sound-propagation-medium', volume: '八年级上册', chapter: '第2章 声现象', sourceType: '演示/选做', title: '探究声音传播需要介质', purpose: '验证真空不能传声', principle: '声音依靠介质传播；真空中没有传播声音的介质', apparatus: '真空罩、电铃（或手机）、抽气机', steps: '电铃在罩内发声→逐渐抽气并听声音变化→再放气并观察声音恢复', conclusion: '空气减少时声音变弱，说明真空不能传声', supplement: '装置难以达到绝对真空，结论来自声音随空气减少而减弱的趋势。' },
  { sourceNumber: 6, id: 'pitch-frequency', volume: '八年级上册', chapter: '第2章 声现象', sourceType: '探究·选做', title: '探究音调与频率的关系', purpose: '理解频率影响音调', principle: '振动频率越高，音调越高', apparatus: '钢尺（或音叉、吉他弦）', steps: '固定钢尺一端→改变伸出长度并拨动→比较振动快慢和听到的音调', conclusion: '振动越快，频率越高，音调越高', supplement: '保持振幅尽量相近，避免把响度变化误判为音调变化。' },
  { sourceNumber: 7, id: 'loudness-amplitude', volume: '八年级上册', chapter: '第2章 声现象', sourceType: '探究·选做', title: '探究响度与振幅的关系', purpose: '理解振幅影响响度', principle: '在其他条件相近时，振幅越大，响度越大', apparatus: '鼓或音叉、纸屑/乒乓球', steps: '以不同力度敲击发声体→观察振幅指示→比较声音强弱', conclusion: '振幅越大，响度越大', supplement: '声音强弱也受距离等影响，应控制听音距离。' },
  { sourceNumber: 8, id: 'water-temperature', volume: '八年级上册', chapter: '第3章 物态变化', sourceType: '基础技能·建议必做', title: '用温度计测量水的温度', purpose: '掌握温度计使用方法', principle: '液体温度计利用测温物质热胀冷缩工作', apparatus: '实验用温度计、烧杯、冷水/温水', steps: '观察量程分度值→玻璃泡浸没且不碰容器→待示数稳定→视线平视液柱上表面读数', conclusion: '读数时温度计不能离开被测液体，示数稳定后读数', supplement: '严禁超过量程；体温计使用规则不同。' },
  { sourceNumber: 9, id: 'solid-melting-temperature', volume: '八年级上册', chapter: '第3章 物态变化', sourceType: '探究·必做', title: '探究固体熔化时温度的变化规律', purpose: '比较晶体和非晶体熔化特点', principle: '晶体熔化时吸热、温度保持不变；非晶体温度持续升高', apparatus: '海波/冰和石蜡、试管、烧杯、温度计、酒精灯、铁架台、石棉网、停表', steps: '水浴加热样品→每隔相同时间记录温度和状态→绘制温度—时间图像→比较两种材料', conclusion: '晶体有固定熔点且熔化过程温度不变；非晶体没有固定熔点', supplement: '采用水浴受热更均匀；持续搅拌并注意酒精灯安全。' },
  { sourceNumber: 10, id: 'water-boiling-temperature', volume: '八年级上册', chapter: '第3章 物态变化', sourceType: '探究·必做', title: '探究水沸腾时温度变化的特点', purpose: '认识沸腾条件和沸点', principle: '水沸腾时继续吸热，温度保持不变；沸点与气压有关', apparatus: '烧杯、水、温度计、酒精灯、石棉网、铁架台、纸板、停表', steps: '安装装置并加热→水温接近90℃后定时记录温度和现象→沸腾后继续记录→作图分析', conclusion: '水沸腾前温度上升；沸腾时吸热但温度保持不变', supplement: '温度计玻璃泡不能碰杯底；纸板留孔防烫且可缩短加热时间。' },
  { sourceNumber: 11, id: 'iodine-sublimation', volume: '八年级上册', chapter: '第3章 物态变化', sourceType: '演示/选做', title: '观察碘的升华和凝华', purpose: '认识升华、凝华现象', principle: '物质可由固态直接变气态（升华），气态直接变固态（凝华）', apparatus: '碘、密封容器、热水（或实验装置）', steps: '隔水加热含碘容器→观察紫色碘蒸气→冷却后观察容器壁晶体', conclusion: '碘可直接升华为气体，也可凝华为固体', supplement: '不直接用酒精灯加热碘，避免碘熔化及有害蒸气外逸。' },
  { sourceNumber: 12, id: 'light-propagation', volume: '八年级上册', chapter: '第4章 光现象', sourceType: '演示/选做', title: '探究光在均匀介质中的传播', purpose: '认识光沿直线传播', principle: '光在同种均匀介质中沿直线传播', apparatus: '激光笔、盛有水或烟雾的透明容器、纸板', steps: '让光通过均匀介质→利用烟雾或纸板显示光路→改变介质均匀性并观察', conclusion: '光在同种均匀介质中沿直线传播', supplement: '激光不得直射眼睛。' },
  { sourceNumber: 13, id: 'pinhole-imaging', volume: '八年级上册', chapter: '第4章 光现象', sourceType: '演示/选做', title: '小孔成像', purpose: '观察小孔成像特点', principle: '光的直线传播；物体各点发出的光通过小孔交叉成像', apparatus: '纸盒、小孔板、半透明纸、蜡烛/光源', steps: '在暗处将物体、小孔、光屏依次放置→移动光屏或物体观察像→改变孔形比较', conclusion: '小孔所成像为倒立的实像；像的大小与物、屏距离有关', supplement: '孔太大像模糊，孔太小亮度低；像的形状与孔形无关。' },
  { sourceNumber: 14, id: 'light-reflection', volume: '八年级上册', chapter: '第4章 光现象', sourceType: '探究·必做', title: '探究光的反射规律', purpose: '验证反射角与入射角关系及三线共面', principle: '反射定律：反射光线、入射光线、法线在同一平面内，反射角等于入射角', apparatus: '平面镜、激光笔、白纸、量角器、纸板', steps: '在纸上画法线→改变入射角并画出反射光线→测量两角→将纸板折起观察反射光', conclusion: '反射角等于入射角，三线在同一平面内', supplement: '角均相对法线测量；镜面须竖直放置。' },
  { sourceNumber: 15, id: 'plane-mirror-imaging', volume: '八年级上册', chapter: '第4章 光现象', sourceType: '探究·必做', title: '探究平面镜成像的特点', purpose: '探究像与物的大小、位置、虚实关系', principle: '平面镜成虚像；像与物关于镜面对称', apparatus: '玻璃板、两支相同蜡烛、白纸、刻度尺、火柴', steps: '用玻璃板代替镜面→点燃前蜡烛→移动后蜡烛与像完全重合→测距离并在像处放光屏验证', conclusion: '像与物等大、等距、连线垂直镜面；平面镜成虚像', supplement: '用薄玻璃板便于确定像的位置；玻璃板应竖直。' },
  { sourceNumber: 16, id: 'air-water-refraction', volume: '八年级上册', chapter: '第4章 光现象', sourceType: '探究·必做', title: '探究光从空气斜射入水中的传播特点', purpose: '认识光的折射规律', principle: '光从一种介质斜射入另一种介质时传播方向一般改变；光路可逆', apparatus: '水槽、水、激光笔、白纸/量角器', steps: '让光斜射空气和水的界面→标出入射光、折射光→改变入射角观察→反向照射验证', conclusion: '光从空气斜射入水中时折射角小于入射角；光路可逆', supplement: '入射角为0时传播方向不变；避免直视激光。' },
  { sourceNumber: 17, id: 'convex-lens-focal-length', volume: '八年级上册', chapter: '第5章 透镜及其应用', sourceType: '基础技能·建议必做', title: '测量凸透镜的焦距', purpose: '会用平行光会聚法估测焦距', principle: '平行于主光轴的光经凸透镜后会聚于焦点', apparatus: '凸透镜、白纸板、刻度尺、太阳光或平行光源', steps: '让透镜正对远处景物/太阳光→移动白纸板至最小最亮光斑或清晰像→测镜心到光屏距离', conclusion: '最小最亮光斑（或远景清晰像）处到透镜的距离约为焦距', supplement: '不可长时间用太阳光聚焦以防灼伤；可用远处景物替代。' },
  { sourceNumber: 18, id: 'convex-lens-imaging', volume: '八年级上册', chapter: '第5章 透镜及其应用', sourceType: '探究·必做', title: '探究凸透镜成像的规律', purpose: '归纳物距、像距与像的性质关系', principle: '凸透镜成像由物距u与焦距f的关系决定', apparatus: '凸透镜、蜡烛、光屏、光具座、刻度尺、火柴', steps: '调节三者同高同轴→改变物距→移动光屏找清晰像→记录像距、大小、正倒、虚实→归纳', conclusion: 'u>2f成倒立缩小实像；f<u<2f成倒立放大实像；u<f成正立放大虚像（u=f不成像）', supplement: '烛焰、透镜、光屏中心等高；实像可在光屏承接，虚像不能。' },
  { sourceNumber: 19, id: 'mass-volume-relation', volume: '八年级上册', chapter: '第6章 质量与密度', sourceType: '探究·必做', title: '探究同种物质的质量与体积的关系', purpose: '建立密度概念', principle: '同种物质质量与体积成正比，m/V为定值', apparatus: '天平、量筒、不同体积的同种金属块/水、烧杯', steps: '调节天平→测不同体积样品质量→记录m和V→作m—V图像或计算m/V', conclusion: '同种物质质量与体积成正比；m/V反映物质的一种特性', supplement: '测量前擦干样品；量筒读数视线与凹液面最低处相平。' },
  { sourceNumber: 20, id: 'salt-water-density', volume: '八年级上册', chapter: '第6章 质量与密度', sourceType: '测量·必做', title: '测量盐水的密度', purpose: '学会用天平、量筒测液体密度', principle: 'ρ=m/V', apparatus: '天平、烧杯、量筒、盐水', steps: '测烧杯和盐水总质量→将部分盐水倒入量筒读体积→测剩余盐水和烧杯质量→求倒出盐水质量与密度', conclusion: '盐水密度等于倒出盐水质量除以其体积', supplement: '采用差量法可避免盐水附着在器壁造成较大误差。' },
  { sourceNumber: 21, id: 'stone-density', volume: '八年级上册', chapter: '第6章 质量与密度', sourceType: '测量·必做', title: '测量小石块的密度', purpose: '学会测不规则固体密度', principle: 'ρ=m/V；排水法测不规则固体体积', apparatus: '天平、量筒、水、细线、小石块', steps: '用天平测石块质量→量筒读初始水量→浸没石块读总体积→求排开水体积和密度', conclusion: '石块密度等于质量除以排开水的体积', supplement: '石块应完全浸没且不接触量筒壁；吸水石块可先浸湿或改用细沙法。' },
  { sourceNumber: 22, id: 'spring-dynamometer', volume: '八年级下册', chapter: '第7章 力', sourceType: '基础技能·必做', title: '练习使用弹簧测力计', purpose: '会正确使用测力计测力', principle: '弹簧在弹性限度内伸长量与拉力成正比', apparatus: '弹簧测力计、钩码/物体', steps: '观察量程分度值→校零→沿弹簧轴线拉动→待示数稳定读数→多次测量', conclusion: '使用前校零；读数不得超过量程且拉力沿轴线', supplement: '指针、刻度盘视线应垂直；不得倒挂超量程。' },
  { sourceNumber: 23, id: 'gravity-mass-relation', volume: '八年级下册', chapter: '第7章 力', sourceType: '探究·必做', title: '探究重力大小跟质量的关系', purpose: '建立G=mg关系', principle: '物体所受重力与质量成正比，G=mg', apparatus: '弹簧测力计、钩码/不同质量物体、天平或标注质量物体', steps: '测多个物体质量和重力→记录数据→绘制G—m图像或计算G/m→分析', conclusion: '在同一地点，物体所受重力与质量成正比，g约为9.8 N/kg', supplement: '测力计需竖直悬挂；不同地区g略有差异。' },
  { sourceNumber: 24, id: 'resistance-motion', volume: '八年级下册', chapter: '第8章 运动和力', sourceType: '探究·必做', title: '探究阻力对物体运动的影响', purpose: '理解牛顿第一定律的实验基础', principle: '阻力越小，物体速度减小得越慢；理想情况下物体将匀速直线运动', apparatus: '斜面、小车、毛巾、棉布、木板', steps: '让小车从同一高度静止滑下→分别在不同表面运动→比较滑行距离和停止快慢', conclusion: '表面越光滑阻力越小，小车运动距离越远；物体不受力时将做匀速直线运动', supplement: '保持释放高度相同，保证到达水平面初速度相同。' },
  { sourceNumber: 25, id: 'force-balance', volume: '八年级下册', chapter: '第8章 运动和力', sourceType: '探究·必做', title: '探究二力平衡的条件', purpose: '归纳平衡力条件', principle: '物体受两个力平衡时，二力等大、反向、同一直线、同一物体', apparatus: '小卡片、两只弹簧测力计、滑轮、细线、剪刀', steps: '两侧拉卡片使其静止→改变两力大小/方向→转动卡片→剪开卡片比较', conclusion: '二力平衡需等大、反向、同一直线且作用在同一物体上', supplement: '小卡片重力应尽量小以减小影响。' },
  { sourceNumber: 26, id: 'sliding-friction-force', volume: '八年级下册', chapter: '第8章 运动和力', sourceType: '测量·建议必做', title: '测量滑动摩擦力', purpose: '会用二力平衡测滑动摩擦力', principle: '匀速直线拉动物体时，拉力与滑动摩擦力平衡', apparatus: '木块、长木板、弹簧测力计、钩码', steps: '用测力计水平匀速拉动木块→读示数→重复测量', conclusion: '匀速直线运动时，滑动摩擦力大小等于拉力示数', supplement: '必须水平、匀速；示数稳定时读数。' },
  { sourceNumber: 27, id: 'sliding-friction-factors', volume: '八年级下册', chapter: '第8章 运动和力', sourceType: '探究·必做', title: '探究影响滑动摩擦力大小的因素', purpose: '分析压力和接触面粗糙程度的影响', principle: '滑动摩擦力与压力、接触面粗糙程度有关', apparatus: '木块、木板、毛巾、弹簧测力计、钩码', steps: '控制接触面不变改变压力→控制压力不变改变接触面→均匀拉动并比较示数', conclusion: '压力越大摩擦力越大；接触面越粗糙摩擦力越大', supplement: '采用控制变量法；保持匀速拉动。' },
  { sourceNumber: 28, id: 'pressure-effect', volume: '八年级下册', chapter: '第9章 压强', sourceType: '探究·选做', title: '探究影响压力作用效果的因素', purpose: '理解压强与压力、受力面积关系', principle: '压力作用效果由压力大小和受力面积共同决定，p=F/S', apparatus: '海绵、压力小桌、砝码', steps: '在受力面积相同条件下改变压力→在压力相同条件下改变受力面积→比较凹陷程度', conclusion: '压力越大、受力面积越小，压力作用效果越明显', supplement: '凹陷程度用作压力作用效果的转换量。' },
  { sourceNumber: 29, id: 'liquid-pressure', volume: '八年级下册', chapter: '第9章 压强', sourceType: '探究·必做', title: '探究液体内部压强的特点', purpose: '了解液体压强与深度、方向、密度关系', principle: '液体内部向各个方向都有压强；同种液体深度越大压强越大；同深度密度越大压强越大', apparatus: 'U形管压强计、水槽、水、盐水、探头', steps: '把探头放入液体不同深度和方向→观察U形管液面高度差→更换不同密度液体比较', conclusion: '液体内部有压强且各方向都有；压强随深度和密度增大而增大', supplement: '实验前检查装置气密性，探头金属盒薄膜不可破损。' },
  { sourceNumber: 30, id: 'torricelli-experiment', volume: '八年级下册', chapter: '第9章 压强', sourceType: '演示/选做', title: '托里拆利实验', purpose: '测量大气压强并理解其存在', principle: '大气压支持水银柱；p0=ρgh', apparatus: '水银、玻璃管、水银槽、刻度尺（演示装置）', steps: '将充满水银的玻璃管倒插水银槽→观察管内水银柱高度→改变管倾斜程度比较', conclusion: '标准大气压可支持约760 mm高水银柱；高度与管倾斜无关', supplement: '水银有毒，教学中宜使用密封演示装置或替代实验。' },
  { sourceNumber: 31, id: 'fluid-pressure-flow-speed', volume: '八年级下册', chapter: '第9章 压强', sourceType: '探究·选做', title: '探究流体压强与流速的关系', purpose: '认识流速影响流体压强', principle: '流体流速大的位置压强小', apparatus: '纸条、两张纸、漏斗和乒乓球或吹风机', steps: '向两纸中间吹气/吹纸条上方→观察纸条运动→改变流速比较', conclusion: '流速大的位置压强较小', supplement: '结论适用于同一流体的流动比较；注意控制吹气方向。' },
  { sourceNumber: 32, id: 'buoyancy-factors', volume: '八年级下册', chapter: '第10章 浮力', sourceType: '探究·必做', title: '探究浮力大小跟哪些因素有关', purpose: '分析浮力与液体密度、排开液体体积的关系', principle: '浮力与液体密度、物体排开液体体积有关，与浸没深度无直接关系', apparatus: '弹簧测力计、金属块、烧杯、水、盐水、细线', steps: '测空气中重力→改变浸入深度记录示数→更换盐水→比较浮力变化', conclusion: '浮力随排开液体体积和液体密度增大而增大', supplement: '用F浮=G−F示计算；物体完全浸没后继续下沉排开体积不变。' },
  { sourceNumber: 33, id: 'archimedes-principle', volume: '八年级下册', chapter: '第10章 浮力', sourceType: '探究·必做', title: '探究浮力大小跟排开液体所受重力的关系', purpose: '验证阿基米德原理', principle: 'F浮=G排', apparatus: '弹簧测力计、金属块、溢水杯、小桶、烧杯、水、细线', steps: '测空桶重和物体重→将物体浸没溢水杯读测力计→收集溢出水并测重→比较', conclusion: '物体受到的浮力等于它排开液体所受的重力', supplement: '物体浸入后不要接触杯底；溢水杯先加满水。' },
  { sourceNumber: 34, id: 'saltwater-egg', volume: '八年级下册', chapter: '第10章 浮力', sourceType: '演示/选做', title: '盐水浮鸡蛋', purpose: '观察物体浮沉条件', principle: '当F浮与G比较决定物体上浮、下沉或悬浮', apparatus: '鸡蛋、清水、食盐、烧杯、玻璃棒', steps: '鸡蛋放入清水观察→逐渐加盐并搅拌→观察鸡蛋由下沉到悬浮/漂浮', conclusion: '增大液体密度会增大浮力，可改变物体浮沉状态', supplement: '盐应充分溶解；避免把“浮力变大”与“重力变化”混淆。' },
  { sourceNumber: 35, id: 'kinetic-energy-factors', volume: '八年级下册', chapter: '第11章 功和机械能', sourceType: '探究·必做', title: '探究动能大小与哪些因素有关', purpose: '分析动能与质量、速度关系', principle: '物体质量越大、速度越大，动能越大；通过推动木块距离转换体现', apparatus: '斜面、小钢球、木块、刻度尺', steps: '同一钢球从不同高度滚下比较木块移动距离→不同质量钢球从同一高度滚下比较', conclusion: '质量相同速度越大动能越大；速度相同质量越大动能越大', supplement: '用控制变量法；钢球应从同一位置由静止释放。' },
  { sourceNumber: 36, id: 'gravitational-potential-energy', volume: '八年级下册', chapter: '第11章 功和机械能', sourceType: '探究·选做', title: '探究重力势能大小与哪些因素有关', purpose: '分析重力势能与质量、高度关系', principle: '物体质量越大、被举得越高，重力势能越大', apparatus: '沙箱、木桩/小桌、不同质量钩码或小球、刻度尺', steps: '控制质量不变改变高度→控制高度不变改变质量→比较下陷程度', conclusion: '质量越大、位置越高，重力势能越大', supplement: '以物体对沙子的作用效果反映能量大小，注意控制变量。' },
  { sourceNumber: 37, id: 'lever-balance', volume: '八年级下册', chapter: '第12章 简单机械', sourceType: '探究·必做', title: '探究杠杆的平衡条件', purpose: '建立杠杆平衡条件', principle: 'F1l1=F2l2', apparatus: '杠杆、铁架台、钩码、弹簧测力计', steps: '调节杠杆在水平位置平衡→两侧挂钩码或施加拉力→记录力和力臂→多组验证', conclusion: '动力×动力臂=阻力×阻力臂', supplement: '水平平衡便于测力臂；力臂是支点到力作用线的距离。' },
  { sourceNumber: 38, id: 'fixed-movable-pulleys', volume: '八年级下册', chapter: '第12章 简单机械', sourceType: '探究·必做', title: '研究定滑轮和动滑轮的特点', purpose: '比较两类滑轮的省力、方向特点', principle: '定滑轮实质为等臂杠杆；动滑轮可省一半力但多移动距离', apparatus: '定滑轮、动滑轮、钩码、弹簧测力计、细线、铁架台', steps: '分别按要求绕线→匀速提升同一钩码→测拉力、移动距离并比较', conclusion: '定滑轮不省力能改变力方向；动滑轮能省力但不能改变力方向', supplement: '实际拉力受摩擦和动滑轮重力影响，大于理论值。' },
  { sourceNumber: 39, id: 'inclined-plane-efficiency', volume: '八年级下册', chapter: '第12章 简单机械', sourceType: '测量·必做', title: '测量斜面的机械效率', purpose: '学会测量简单机械效率并分析影响因素', principle: 'η=W有用/W总=Gh/Fs', apparatus: '斜面、木块、弹簧测力计、刻度尺、钩码', steps: '测斜面高h和沿面长s→匀速拉木块上升测F→计算η→改变斜面倾角重复', conclusion: '斜面越陡通常机械效率越高；机械效率小于1', supplement: '要沿斜面匀速拉动；同一斜面粗糙程度保持不变。' },
  { sourceNumber: 40, id: 'gas-diffusion', volume: '九年级全一册', chapter: '第13章 内能', sourceType: '演示/选做', title: '气体扩散实验', purpose: '认识扩散现象', principle: '分子在不停地做无规则运动', apparatus: '盛有空气和二氧化氮的玻璃瓶（或香水、红墨水）', steps: '使两种气体/液体接触→静置观察颜色逐渐均匀→比较初末状态', conclusion: '不同物质相互接触会彼此进入对方，说明分子在不停运动', supplement: '二氧化氮有毒，宜用密封装置或安全替代材料。' },
  { sourceNumber: 41, id: 'diffusion-rate', volume: '九年级全一册', chapter: '第13章 内能', sourceType: '探究·选做', title: '探究影响扩散快慢的因素', purpose: '认识温度影响分子无规则运动快慢', principle: '温度越高，分子无规则运动越剧烈，扩散越快', apparatus: '冷水、热水、烧杯、红墨水/高锰酸钾', steps: '向等量冷、热水中同时滴入染料→不搅拌观察颜色扩散速度→比较', conclusion: '温度越高，扩散越快', supplement: '保持水量、染料量相同；不搅拌避免对流干扰。' },
  { sourceNumber: 42, id: 'molecular-attraction', volume: '九年级全一册', chapter: '第13章 内能', sourceType: '演示/选做', title: '探究分子之间存在引力', purpose: '认识分子间存在相互作用力', principle: '分子间存在引力和斥力', apparatus: '两块铅块/玻璃片、水', steps: '将表面平整清洁的铅块紧压后悬挂钩码（或湿玻璃片贴合）→观察不易分开', conclusion: '分子间存在引力', supplement: '表面应平整、清洁；实验现象还需排除大气压等影响。' },
  { sourceNumber: 43, id: 'work-changes-internal-energy', volume: '九年级全一册', chapter: '第13章 内能', sourceType: '演示/选做', title: '做功改变物体的内能', purpose: '认识做功可改变内能', principle: '做功与热传递都可改变内能', apparatus: '厚壁玻璃瓶、塞子、水、打气筒（或空气压缩仪）', steps: '瓶内留少量水→快速打气→塞子跳起时观察瓶口白雾→解释气体膨胀做功', conclusion: '对物体做功，内能增加；物体对外做功，内能减少', supplement: '装置需牢固，塞子弹出方向不得对人。' },
  { sourceNumber: 44, id: 'heat-capacity-comparison', volume: '九年级全一册', chapter: '第13章 内能', sourceType: '探究·必做', title: '比较不同物质的吸热能力', purpose: '理解比热容的物理意义', principle: '质量相等、升高相同温度时，吸热多的物质比热容大；Q吸=cmΔt', apparatus: '质量相等的水和食用油、相同规格烧杯、温度计、秒表、酒精灯/电加热器', steps: '测初温→用相同加热装置加热→记录升高相同温度所需时间或相同时间温升→比较', conclusion: '不同物质吸热能力不同；水的吸热能力较强、比热容较大', supplement: '控制质量、初温、加热条件相同；可用加热时间反映吸热量。' },
  { sourceNumber: 45, id: 'heat-engine-model', volume: '九年级全一册', chapter: '第14章 内能的利用', sourceType: '演示/选做', title: '热机模拟实验', purpose: '认识内能转化为机械能的过程', principle: '燃料燃烧使工质内能增加，膨胀做功推动活塞', apparatus: '试管/蒸汽轮机模型、橡皮塞、水、酒精灯（演示）', steps: '在试管内加少量水→加热使水汽化→水蒸气推动塞子跳起→分析能量转化', conclusion: '内能可以转化为机械能；热机利用内能做功', supplement: '须使用安全演示装置，严禁密闭强热；注意防烫。' },
  { sourceNumber: 46, id: 'electric-charge-interaction', volume: '九年级全一册', chapter: '第15章 电流和电路', sourceType: '演示/选做', title: '探究电荷间的相互作用', purpose: '认识同种、异种电荷的作用规律', principle: '同种电荷互相排斥，异种电荷互相吸引', apparatus: '丝绸、玻璃棒、毛皮、橡胶棒、验电器/轻小物体', steps: '摩擦起电→使带电体相互靠近→观察吸引或排斥→用已知电荷验证', conclusion: '同种电荷相斥，异种电荷相吸', supplement: '“吸引”不能单独判定异种电荷，可能是带电体吸引轻小物体。' },
  { sourceNumber: 47, id: 'series-parallel-circuit', volume: '九年级全一册', chapter: '第15章 电流和电路', sourceType: '基础技能·必做', title: '连接串联电路和并联电路', purpose: '会按电路图连接基本电路', principle: '串联电路只有一条电流路径；并联电路有多条支路', apparatus: '电源、开关、小灯泡、导线、灯座', steps: '断开开关→按图连接串联电路并试验→断电改接并联电路→检查各灯工作情况', conclusion: '串联元件相互影响；并联支路可独立工作', supplement: '连接前先画图；严禁不经用电器直接连接电源两极。' },
  { sourceNumber: 48, id: 'ammeter-use', volume: '九年级全一册', chapter: '第15章 电流和电路', sourceType: '基础技能·必做', title: '练习使用电流表', purpose: '会正确测量电流', principle: '电流表必须串联在被测电路中；电流从正接线柱流入', apparatus: '电流表、电源、开关、小灯泡、导线', steps: '估计电流选大量程→断电串联电流表→闭合开关读数→必要时换小量程精读', conclusion: '电流表应串联使用，先用大量程试触以保护仪表', supplement: '绝不能把电流表直接接电源两极。' },
  { sourceNumber: 49, id: 'series-circuit-current', volume: '九年级全一册', chapter: '第15章 电流和电路', sourceType: '探究·必做', title: '探究串联电路中各处电流的关系', purpose: '验证串联电流规律', principle: '串联电路中电流处处相等', apparatus: '电源、开关、两灯泡、电流表、导线', steps: '连接串联电路→分别将电流表接在不同位置测电流→更换器材重复→比较', conclusion: '串联电路中I=I1=I2', supplement: '测量时应断开开关后改接电流表；多组数据增强可靠性。' },
  { sourceNumber: 50, id: 'parallel-circuit-current', volume: '九年级全一册', chapter: '第15章 电流和电路', sourceType: '探究·必做', title: '探究并联电路中电流的关系', purpose: '验证并联电流规律', principle: '并联电路干路电流等于各支路电流之和', apparatus: '电源、开关、两灯泡、三只电流表或一只电流表、导线', steps: '连接并联电路→测干路和各支路电流→更换规格不同灯泡重复→比较', conclusion: '并联电路中I=I1+I2', supplement: '各电流表量程选择合理；注意避免短路。' },
  { sourceNumber: 51, id: 'voltmeter-use', volume: '九年级全一册', chapter: '第16章 电压 电阻', sourceType: '基础技能·必做', title: '练习使用电压表', purpose: '会正确测量电压', principle: '电压表应并联在被测用电器两端，电流从正接线柱流入', apparatus: '电压表、电源、开关、小灯泡、导线', steps: '估计电压选大量程→断电并联电压表→闭合开关读数→需要时换小量程', conclusion: '电压表应并联使用；被测电压不得超过量程', supplement: '读数前确认接线柱与量程；不可把电压表串联在电路中。' },
  { sourceNumber: 52, id: 'series-parallel-voltage', volume: '九年级全一册', chapter: '第16章 电压 电阻', sourceType: '探究·必做', title: '探究串、并联电路电压的规律', purpose: '验证串联分压、并联等压规律', principle: '串联电路总电压等于各部分电压之和；并联各支路两端电压相等', apparatus: '电源、开关、两灯泡、电压表、导线', steps: '分别连接串联和并联电路→测电源及各灯两端电压→记录比较→换器材复测', conclusion: '串联U=U1+U2；并联U=U1=U2', supplement: '电压表每次改接前需断开开关；注意正负接线柱。' },
  { sourceNumber: 53, id: 'resistance-factors', volume: '九年级全一册', chapter: '第16章 电压 电阻', sourceType: '探究·必做', title: '探究影响导体电阻大小的因素', purpose: '认识电阻与材料、长度、横截面积、温度关系', principle: '导体电阻由材料、长度、横截面积和温度决定', apparatus: '电源、开关、电流表、不同电阻丝、滑动变阻器、导线', steps: '连接比较电路→控制材料和横截面积相同改变长度→控制材料和长度相同改变截面积→更换材料比较', conclusion: '同种材料导线越长电阻越大、横截面积越小电阻越大；材料不同电阻不同', supplement: '用电流大小间接反映电阻；必须控制变量。' },
  { sourceNumber: 54, id: 'rheostat-use', volume: '九年级全一册', chapter: '第16章 电压 电阻', sourceType: '基础技能·必做', title: '练习使用滑动变阻器', purpose: '会用滑动变阻器改变电流', principle: '接入电阻丝的有效长度改变，电阻随之改变', apparatus: '滑动变阻器、电源、开关、小灯泡、电流表、导线', steps: '选择“一上一下”接线柱→闭合前调到最大阻值→闭合后移动滑片观察灯亮/电流变化', conclusion: '接入电阻丝越长，电阻越大，电流越小', supplement: '接线需一上一下；闭合开关前滑片置于最大阻值处。' },
  { sourceNumber: 55, id: 'ohms-law', volume: '九年级全一册', chapter: '第17章 欧姆定律', sourceType: '探究·必做', title: '探究电流与电压、电阻的关系', purpose: '建立欧姆定律', principle: '同一导体电阻不变时I与U成正比；电压不变时I与R成反比，I=U/R', apparatus: '电源、开关、电流表、电压表、定值电阻、滑动变阻器、导线', steps: '按伏安法电路连接→保持R不变调节电压记录I→保持U不变换R并调节滑变记录I→分析图像/数据', conclusion: '电阻一定时I与U成正比；电压一定时I与R成反比', supplement: '滑变用于改变电压和保护电路；每次换电阻后须重新调到规定电压。' },
  { sourceNumber: 56, id: 'volt-ampere-resistance', volume: '九年级全一册', chapter: '第17章 欧姆定律', sourceType: '测量·必做', title: '伏安法测量定值电阻', purpose: '用电压、电流计算电阻', principle: 'R=U/I', apparatus: '电源、开关、电流表、电压表、定值电阻、滑动变阻器、导线', steps: '连接伏安法电路→闭合前调最大阻值→改变滑片取得多组U、I→计算各组R并取平均', conclusion: '定值电阻阻值近似不变，可由多组U/I平均得到', supplement: '电流表串联、电压表并联；排查故障时先断电。' },
  { sourceNumber: 57, id: 'bulb-electric-power', volume: '九年级全一册', chapter: '第18章 电功率', sourceType: '测量·必做', title: '测量小灯泡的电功率', purpose: '测量不同电压下小灯泡实际功率', principle: 'P=UI；额定电压下实际功率等于额定功率', apparatus: '电源、开关、电流表、电压表、额定电压小灯泡、滑动变阻器、导线', steps: '按伏安法连接→调节滑变使U=U额记录I→再测低于/高于额定电压时U、I→算P=UI并观察亮度', conclusion: '灯泡亮度由实际功率决定；额定电压下P实=P额', supplement: '灯丝电阻随温度变，不宜用多组R平均；过压时间应短防止烧灯。' },
  { sourceNumber: 58, id: 'current-heating-effect', volume: '九年级全一册', chapter: '第18章 电功率', sourceType: '探究·选做', title: '探究电流的热效应', purpose: '认识焦耳定律中电流、电阻、时间的影响', principle: 'Q=I²Rt；通过液体升温或空气膨胀反映放热', apparatus: '焦耳定律演示器/电阻丝、U形管、导线、电源', steps: '连接串、并联控制电路→在相同时间比较两容器液面高度差→改变电流或电阻重复', conclusion: '电流越大、电阻越大、通电时间越长，产生热量越多', supplement: '密闭空气装置用液面高度差反映温度变化；避免长时间通电。' },
  { sourceNumber: 59, id: 'fuse-function', volume: '九年级全一册', chapter: '第19章 生活用电', sourceType: '演示/选做', title: '观察保险丝的作用', purpose: '认识保险丝的保护作用', principle: '电流过大时保险丝发热熔断，自动切断电路', apparatus: '低压演示电路、保险丝/保险装置、灯泡、导线', steps: '连接正常电路→通过增加负载或短路模拟电流过大（演示）→观察保险丝熔断', conclusion: '保险丝在电流过大时自动熔断保护电路', supplement: '只能使用低压安全演示装置；严禁在市电环境下短路实验。' },
  { sourceNumber: 60, id: 'solenoid-magnetic-field', volume: '九年级全一册', chapter: '第20章 电与磁', sourceType: '探究·必做', title: '探究通电螺线管外部磁场分布', purpose: '认识通电螺线管磁场特点', principle: '通电螺线管外部磁场与条形磁体相似；极性由电流方向决定', apparatus: '螺线管、电源、开关、小磁针、铁屑、纸板', steps: '给螺线管通电→在周围放小磁针/撒铁屑观察分布→改变电流方向比较', conclusion: '通电螺线管外部磁场与条形磁体相似，电流方向改变磁极对调', supplement: '铁屑实验后先断电再整理；小磁针应远离其他磁体。' },
  { sourceNumber: 61, id: 'electromagnet-strength', volume: '九年级全一册', chapter: '第20章 电与磁', sourceType: '探究·必做', title: '探究影响电磁铁磁性强弱的因素', purpose: '分析电流大小、线圈匝数对磁性的影响', principle: '在其他条件相同时，电流越大、线圈匝数越多，电磁铁磁性越强', apparatus: '电磁铁、电源、开关、滑动变阻器、大头针、导线', steps: '用吸引大头针数量表示磁性→控制匝数改变电流→控制电流改变匝数→比较', conclusion: '电流越大、匝数越多，电磁铁磁性越强', supplement: '可用滑动变阻器调电流；通电时间不宜过长防止线圈发热。' },
  { sourceNumber: 62, id: 'magnetic-force-on-conductor', volume: '九年级全一册', chapter: '第20章 电与磁', sourceType: '演示/选做', title: '观察磁场对通电导体的作用', purpose: '认识电动机工作原理', principle: '通电导体在磁场中受到力的作用；力方向与电流方向、磁场方向有关', apparatus: '蹄形磁体、直导线/线圈、电源、开关、导轨', steps: '把通电导体放入磁场→闭合开关观察运动→分别改变电流或磁场方向→比较', conclusion: '通电导体在磁场中受力，改变电流或磁场方向，受力方向改变', supplement: '导体应与磁场方向垂直；电流较大时防止线圈过热。' },
  { sourceNumber: 63, id: 'electromagnetic-induction', volume: '九年级全一册', chapter: '第20章 电与磁', sourceType: '探究·必做', title: '探究什么情况下磁可以生电', purpose: '认识电磁感应产生条件', principle: '闭合电路的一部分导体在磁场中做切割磁感线运动时产生感应电流', apparatus: '蹄形磁体、导体棒、导轨、灵敏电流计、导线', steps: '闭合电路→使导体棒在磁场中静止和不同方向运动→观察指针偏转→改变运动方向或磁场方向', conclusion: '闭合电路的一部分导体做切割磁感线运动时产生感应电流；方向随运动/磁场方向改变', supplement: '使用灵敏电流计；导体运动方向应尽量垂直磁感线。' },
  { sourceNumber: 64, id: 'electromagnetic-wave-reception', volume: '九年级全一册', chapter: '第21章 信息的传递', sourceType: '演示/选做', title: '观察电磁波的产生与接收', purpose: '了解电磁波可传递信息', principle: '变化的电流周围产生电磁波；接收装置可把电磁波转为信号', apparatus: '收音机/手机、发射源、屏蔽材料（演示）', steps: '开启接收装置→改变与发射源距离或用金属屏蔽→观察接收信号变化', conclusion: '电磁波能在空间传播并传递信息，金属屏蔽会影响接收', supplement: '不同场所信号受环境影响很大，仅作现象演示。' },
  { sourceNumber: 65, id: 'chain-reaction-model', volume: '九年级全一册', chapter: '第22章 能源与可持续发展', sourceType: '模型/选做', title: '用火柴模拟链式反应', purpose: '理解链式反应的连锁特征', principle: '一个中子引发裂变可放出多个中子，进而继续引发裂变', apparatus: '火柴若干、固定支架/模拟装置', steps: '按规则摆放火柴→点燃一个触发点→观察依次引燃的过程→讨论可控与不可控', conclusion: '链式反应具有连锁性；控制反应速率是核能利用的关键', supplement: '严格防火，建议采用视频、动画或安全模拟材料替代真实火柴。' },
]

export const textbookPhysicsExperiments: readonly TextbookPhysicsExperiment[] = workbookExperiments.map(experiment)

export const textbookExperimentById: ReadonlyMap<string, TextbookPhysicsExperiment> = new Map(
  textbookPhysicsExperiments.map((item) => [item.id, item]),
)

export function filterTextbookExperiments(filters: CurriculumFilters): readonly TextbookPhysicsExperiment[] {
  const query = filters.query.trim().toLocaleLowerCase('zh-CN')
  return textbookPhysicsExperiments.filter((item) => {
    const matchesVolume = filters.volume === 'ALL' || item.volume === filters.volume
    const matchesChapter = filters.chapter === 'ALL' || item.chapter === filters.chapter
    const matchesRequirement = filters.requirement === 'ALL' || item.requirement === filters.requirement
    const haystack = [item.title, item.chapter, ...item.purpose, ...item.principle].join(' ').toLocaleLowerCase('zh-CN')
    return matchesVolume && matchesChapter && matchesRequirement && (!query || haystack.includes(query))
  })
}
