export type PhysicsDifficulty = 'beginner' | 'elementary' | 'intermediate' | 'advanced'

export interface PhysicsScriptLine {
  text: string
  formula?: string
}

export interface PhysicsScriptSection {
  id: string
  title: string
  lines: readonly PhysicsScriptLine[]
}

export interface PhysicsExperiment {
  slug: string
  title: string
  subtitle: string
  category: string
  difficulty: PhysicsDifficulty
  targetAge: string
  sourcePath: string
  sourceChunk: string
  objectives: readonly string[]
  prerequisites: readonly string[]
  sections: readonly PhysicsScriptSection[]
  furtherReading: readonly { title: string; description: string }[]
}

export interface PhysicsCategory {
  name: string
  items: string[]
}

export const physicsCategories = [
  {
    "name": "力学",
    "items": [
      "projectile-motion",
      "pendulum",
      "spring-oscillation",
      "collision",
      "circular-motion",
      "inclined-plane",
      "pulley-system",
      "forced-oscillation",
      "coriolis-force",
      "gyroscope"
    ]
  },
  {
    "name": "电磁学",
    "items": [
      "coulomb-law",
      "electric-field",
      "electric-field-3d",
      "magnetic-field",
      "lorentz-force",
      "rc-circuit",
      "electromagnetic-induction",
      "capacitor",
      "ampere-force",
      "transformer"
    ]
  },
  {
    "name": "波动",
    "items": [
      "wave-interference",
      "standing-wave",
      "doppler-effect",
      "coupled-lattice",
      "beat-frequency",
      "lissajous",
      "air-column",
      "mach-cone",
      "group-velocity",
      "huygens-principle"
    ]
  },
  {
    "name": "光学",
    "items": [
      "refraction",
      "lens",
      "total-reflection",
      "double-slit",
      "diffraction-grating",
      "thin-film",
      "polarization",
      "prism-dispersion",
      "newton-rings",
      "michelson-interferometer"
    ]
  },
  {
    "name": "热学",
    "items": [
      "thermal-expansion",
      "ideal-gas",
      "carnot-cycle",
      "heat-conduction",
      "brownian-motion",
      "maxwell-distribution",
      "blackbody-radiation",
      "phase-diagram",
      "diffusion",
      "joule-thomson"
    ]
  },
  {
    "name": "近代物理",
    "items": [
      "photoelectric",
      "bohr-model",
      "radioactive-decay",
      "wave-particle-duality",
      "compton-scattering",
      "de-broglie",
      "mass-energy",
      "quantum-tunneling",
      "atomic-spectra",
      "franck-hertz"
    ]
  },
  {
    "name": "电路电子",
    "items": [
      "ohms-law",
      "rlc-resonance",
      "kirchhoff",
      "diode",
      "transistor-amplifier",
      "lc-oscillation",
      "op-amp",
      "rectifier",
      "wheatstone-bridge",
      "logic-gates"
    ]
  },
  {
    "name": "流体声学",
    "items": [
      "bernoulli",
      "buoyancy",
      "fourier-synthesis",
      "karman-vortex",
      "capillary",
      "poiseuille",
      "stokes-law",
      "water-wave",
      "venturi",
      "reynolds-number"
    ]
  },
  {
    "name": "天体物理",
    "items": [
      "gravitation",
      "kepler-laws",
      "binary-star",
      "cosmic-velocity",
      "gravitational-lensing",
      "tidal-force",
      "lagrange-points",
      "black-hole",
      "hubble-law",
      "hr-diagram"
    ]
  },
  {
    "name": "非线性动力学",
    "items": [
      "double-pendulum",
      "lorenz-attractor",
      "logistic-map",
      "van-der-pol",
      "chua-circuit",
      "duffing-oscillator",
      "pendulum-phase",
      "mandelbrot",
      "kdv-soliton",
      "henon-map"
    ]
  },
  {
    "name": "量子信息",
    "items": [
      "qubit-bloch",
      "quantum-gates",
      "quantum-entanglement",
      "schrodinger-cat",
      "quantum-rng",
      "bb84",
      "quantum-teleportation",
      "grover-search",
      "decoherence",
      "chsh-bell"
    ]
  },
  {
    "name": "相对论",
    "items": [
      "time-dilation",
      "length-contraction",
      "twin-paradox",
      "relativistic-doppler",
      "velocity-addition",
      "relativistic-momentum",
      "simultaneity",
      "mass-energy-equivalence",
      "light-cone",
      "gravitational-time-dilation"
    ]
  },
  {
    "name": "生物物理",
    "items": [
      "action-potential",
      "dna-melting",
      "dla-growth",
      "enzyme-kinetics",
      "ecg",
      "lotka-volterra",
      "eye-optics",
      "blood-flow",
      "protein-folding",
      "firefly-sync"
    ]
  },
  {
    "name": "地球物理",
    "items": [
      "seismic-waves",
      "plate-tectonics",
      "geomagnetism"
    ]
  }
] as const satisfies readonly PhysicsCategory[]

export const physicsExperiments = [
  {
    "slug": "projectile-motion",
    "title": "抛体运动",
    "subtitle": "探索物体在重力作用下的运动轨迹",
    "category": "力学",
    "difficulty": "intermediate",
    "targetAge": "15-18岁",
    "sourcePath": "/projectile-motion",
    "sourceChunk": "ProjectileMotionExperiment-D-MBK9H6.js",
    "objectives": [
      "理解抛体运动的基本概念",
      "掌握抛体运动的分解方法",
      "学会计算抛体运动的射程和最大高度",
      "理解空气阻力对抛体运动的影响"
    ],
    "prerequisites": [
      "匀速直线运动",
      "自由落体运动",
      "力的分解与合成"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到物理之美！今天我们要探索一个非常有趣的话题——抛体运动。"
          },
          {
            "text": "当你扔出一个篮球、踢出一个足球，或者发射一枚炮弹时，它们都在做抛体运动。"
          },
          {
            "text": "让我们一起来揭开抛体运动的奥秘吧！"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "抛体运动是指物体在重力作用下，沿曲线运动的过程。"
          },
          {
            "text": "在理想情况下，我们忽略空气阻力，只考虑重力的作用。"
          },
          {
            "text": "抛体运动可以分解为两个独立的运动：水平方向的匀速直线运动，和竖直方向的自由落体运动。"
          },
          {
            "text": "这种分解方法是伽利略首先提出的，被称为运动的独立性原理。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "水平方向上，物体做匀速直线运动，位移公式是 x 等于 v0 乘以 cos θ 再乘以 t。",
            "formula": "x = v_0 \\cos\\theta \\cdot t"
          },
          {
            "text": "竖直方向上，物体做匀变速直线运动，位移公式是 y 等于 v0 乘以 sin θ 乘以 t，减去二分之一 g t 平方。",
            "formula": "y = v_0 \\sin\\theta \\cdot t - \\frac{1}{2}gt^2"
          },
          {
            "text": "消去时间 t，我们可以得到抛物线方程，这就是抛体运动轨迹的数学表达式。",
            "formula": "y = x\\tan\\theta - \\frac{gx^2}{2v_0^2\\cos^2\\theta}"
          }
        ]
      },
      {
        "id": "animation",
        "title": "动画演示",
        "lines": [
          {
            "text": "现在让我们通过动画来观察抛体运动。请注意物体的运动轨迹。"
          },
          {
            "text": "你可以看到，物体沿着一条抛物线运动。这条曲线就是抛体运动的轨迹。"
          },
          {
            "text": "注意观察，在最高点时，物体的竖直速度为零，但水平速度保持不变。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "现在你可以尝试调整初速度和发射角度，观察它们对运动轨迹的影响。"
          },
          {
            "text": "当发射角度为 45 度时，在相同初速度下，射程达到最大值。"
          },
          {
            "text": "增大初速度会同时增加射程和最大高度。试着调整滑块来验证这一点。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "抛体运动在生活中有很多应用。比如篮球投篮时，运动员需要计算最佳的出手角度和力度。"
          },
          {
            "text": "在军事上，炮兵需要根据目标距离和地形，计算炮弹的发射角度。"
          },
          {
            "text": "喷泉的水柱、烟花的轨迹，都遵循抛体运动的规律。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "让我们来总结一下今天学到的内容。"
          },
          {
            "text": "抛体运动可以分解为水平方向的匀速运动和竖直方向的自由落体运动。"
          },
          {
            "text": "抛体运动的轨迹是一条抛物线，射程和最大高度取决于初速度和发射角度。"
          },
          {
            "text": "感谢你的学习！下次我们将探索更多有趣的物理现象。"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "伽利略与运动学",
        "description": "了解伽利略如何通过实验发现运动的独立性原理"
      },
      {
        "title": "空气阻力的影响",
        "description": "探索真实世界中空气阻力如何改变抛体运动的轨迹"
      }
    ]
  },
  {
    "slug": "pendulum",
    "title": "单摆运动",
    "subtitle": "探索单摆的周期性运动规律",
    "category": "力学",
    "difficulty": "elementary",
    "targetAge": "12-15岁",
    "sourcePath": "/pendulum",
    "sourceChunk": "PendulumExperiment-Yj64-MY4.js",
    "objectives": [
      "理解单摆运动的基本概念",
      "掌握单摆周期公式",
      "观察摆长和重力对周期的影响"
    ],
    "prerequisites": [
      "简谐运动基础",
      "三角函数基础"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到单摆运动实验！今天我们要探索一种古老而优美的运动形式。"
          },
          {
            "text": "单摆是最简单的周期运动之一，从古代的摆钟到现代的地震仪，都应用了单摆原理。"
          },
          {
            "text": "伽利略在比萨大教堂观察吊灯摆动时，发现了单摆的等时性。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "单摆由一根不可伸长的轻绳和一个小球组成，绳的一端固定，另一端悬挂小球。"
          },
          {
            "text": "当小球偏离平衡位置后释放，它会在重力作用下来回摆动。"
          },
          {
            "text": "在小角度摆动时，单摆做简谐运动，周期与摆动幅度无关。"
          },
          {
            "text": "这就是单摆的等时性，也是摆钟能够精确计时的原理。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "单摆的周期公式是 T 等于 2π 乘以根号下 L 除以 g。",
            "formula": "T = 2\\pi\\sqrt{\\frac{L}{g}}"
          },
          {
            "text": "其中 T 是周期，L 是摆长，g 是重力加速度。"
          },
          {
            "text": "注意，周期只与摆长和重力加速度有关，与小球质量和摆动幅度无关。"
          },
          {
            "text": "这个公式在小角度近似下成立，通常要求摆角小于 15 度。"
          }
        ]
      },
      {
        "id": "animation",
        "title": "动画演示",
        "lines": [
          {
            "text": "现在让我们观察单摆的运动。点击开始按钮，小球将开始摆动。"
          },
          {
            "text": "注意观察，小球在最低点速度最快，在最高点速度为零。"
          },
          {
            "text": "这是因为重力势能和动能在不断相互转化，总机械能保持不变。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "你可以调整右侧的摆长滑块，观察周期如何变化。"
          },
          {
            "text": "摆长越长，周期越大，摆动越慢。"
          },
          {
            "text": "你也可以调整重力加速度，模拟在不同星球上的单摆运动。"
          },
          {
            "text": "在月球上，重力加速度约为地球的六分之一，单摆周期会变长。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "单摆原理在生活中有很多应用。最著名的就是摆钟。"
          },
          {
            "text": "惠更斯在 1656 年发明了第一台摆钟，大大提高了计时精度。"
          },
          {
            "text": "傅科摆可以证明地球自转，是物理学史上的经典实验。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "让我们总结一下今天学到的内容。"
          },
          {
            "text": "单摆在小角度下做简谐运动，具有等时性。"
          },
          {
            "text": "周期公式 T 等于 2π 根号下 L 除以 g，只与摆长和重力加速度有关。"
          },
          {
            "text": "希望通过这个实验，你对单摆运动有了更深入的理解！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "傅科摆与地球自转",
        "description": "了解傅科摆如何证明地球自转"
      },
      {
        "title": "摆钟的历史",
        "description": "探索摆钟的发明和发展历程"
      }
    ]
  },
  {
    "slug": "spring-oscillation",
    "title": "弹簧振子",
    "subtitle": "探索弹簧振子的简谐运动",
    "category": "力学",
    "difficulty": "intermediate",
    "targetAge": "15-18岁",
    "sourcePath": "/spring-oscillation",
    "sourceChunk": "SpringOscillationExperiment-B6BfY5iX.js",
    "objectives": [
      "理解弹簧振子的运动规律",
      "掌握胡克定律和简谐运动方程",
      "观察弹簧劲度系数和质量对周期的影响"
    ],
    "prerequisites": [
      "牛顿运动定律",
      "简谐运动基础"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到弹簧振子实验！今天我们要探索另一种经典的简谐运动。"
          },
          {
            "text": "弹簧振子是研究振动的理想模型，从汽车悬挂到原子振动，都可以用它来描述。"
          },
          {
            "text": "让我们一起来揭开弹簧振子的奥秘吧！"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "弹簧振子由一个弹簧和一个质量块组成，弹簧一端固定，另一端连接质量块。"
          },
          {
            "text": "当质量块偏离平衡位置时，弹簧会产生恢复力，使质量块往回运动。"
          },
          {
            "text": "这个恢复力遵循胡克定律：F 等于负 k 乘以 x，其中 k 是弹簧劲度系数。"
          },
          {
            "text": "负号表示恢复力的方向总是指向平衡位置。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "弹簧振子的周期公式是 T 等于 2π 乘以根号下 m 除以 k。",
            "formula": "T = 2\\pi\\sqrt{\\frac{m}{k}}"
          },
          {
            "text": "其中 T 是周期，m 是质量块的质量，k 是弹簧劲度系数。"
          },
          {
            "text": "位移方程是 x 等于 A 乘以 cos(ωt + φ)，其中 ω 等于根号下 k 除以 m。",
            "formula": "x = A\\cos(\\omega t + \\varphi)"
          },
          {
            "text": "注意，周期与振幅无关，这是简谐运动的重要特征。"
          }
        ]
      },
      {
        "id": "animation",
        "title": "动画演示",
        "lines": [
          {
            "text": "现在让我们观察弹簧振子的运动。点击开始按钮，质量块将开始振动。"
          },
          {
            "text": "注意观察，质量块在平衡位置速度最大，在最大位移处速度为零。"
          },
          {
            "text": "弹性势能和动能在不断相互转化，总机械能保持不变。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "你可以调整弹簧劲度系数 k，观察周期如何变化。"
          },
          {
            "text": "k 越大，弹簧越硬，周期越短，振动越快。"
          },
          {
            "text": "你也可以调整质量 m，质量越大，周期越长，振动越慢。"
          },
          {
            "text": "调整振幅 A，观察振幅变化不影响周期。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "弹簧振子模型在工程中有广泛应用。"
          },
          {
            "text": "汽车的悬挂系统就是一个弹簧振子，用来吸收路面颠簸。"
          },
          {
            "text": "地震仪也利用弹簧振子原理来检测地面振动。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "让我们总结一下今天学到的内容。"
          },
          {
            "text": "弹簧振子在恢复力作用下做简谐运动，恢复力遵循胡克定律。"
          },
          {
            "text": "周期公式 T 等于 2π 根号下 m 除以 k，与振幅无关。"
          },
          {
            "text": "希望通过这个实验，你对弹簧振子有了更深入的理解！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "阻尼振动",
        "description": "了解实际振动中的能量损耗"
      },
      {
        "title": "受迫振动与共振",
        "description": "探索共振现象及其应用"
      }
    ]
  },
  {
    "slug": "collision",
    "title": "碰撞与动量",
    "subtitle": "探索碰撞过程中的动量守恒",
    "category": "力学",
    "difficulty": "intermediate",
    "targetAge": "15-18岁",
    "sourcePath": "/collision",
    "sourceChunk": "CollisionExperiment-DBW94koG.js",
    "objectives": [
      "理解动量和动量守恒定律",
      "区分弹性碰撞和非弹性碰撞",
      "观察碰撞过程中能量的转化"
    ],
    "prerequisites": [
      "牛顿运动定律",
      "动能和势能"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到碰撞与动量实验！今天我们要探索物体碰撞的奥秘。"
          },
          {
            "text": "从台球撞击到汽车碰撞，碰撞现象在生活中无处不在。"
          },
          {
            "text": "理解碰撞规律，对于设计安全气囊、研究粒子物理都至关重要。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "动量是描述物体运动状态的物理量，等于质量乘以速度，用 p 表示。"
          },
          {
            "text": "动量守恒定律说：在没有外力作用的系统中，总动量保持不变。"
          },
          {
            "text": "碰撞分为弹性碰撞和非弹性碰撞两种类型。"
          },
          {
            "text": "弹性碰撞中动能守恒，非弹性碰撞中动能有损失。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "动量定义为 p 等于 m 乘以 v。",
            "formula": "p = mv"
          },
          {
            "text": "动量守恒：碰撞前后总动量相等，m1v1 加 m2v2 等于 m1v1撇 加 m2v2撇。",
            "formula": "m_1v_1 + m_2v_2 = m_1v_1' + m_2v_2'"
          },
          {
            "text": "弹性碰撞还满足动能守恒，非弹性碰撞动能有损失。"
          },
          {
            "text": "完全非弹性碰撞后两物体粘在一起，动能损失最大。"
          }
        ]
      },
      {
        "id": "animation",
        "title": "动画演示",
        "lines": [
          {
            "text": "现在让我们观察两个小球的碰撞。点击开始按钮，小球将开始运动。"
          },
          {
            "text": "注意观察碰撞前后两个小球的速度变化。"
          },
          {
            "text": "下方显示了碰撞前后的动量和动能，验证守恒定律。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "你可以调整两个小球的质量和初速度。"
          },
          {
            "text": "切换碰撞类型，观察弹性碰撞和非弹性碰撞的区别。"
          },
          {
            "text": "当两球质量相等时，弹性碰撞后它们会交换速度。"
          },
          {
            "text": "调整恢复系数，观察不同程度的非弹性碰撞。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "动量守恒在生活中有很多应用。"
          },
          {
            "text": "汽车安全气囊利用延长碰撞时间来减小冲击力。"
          },
          {
            "text": "火箭发射利用动量守恒原理，喷出气体获得反冲力。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "让我们总结一下今天学到的内容。"
          },
          {
            "text": "动量等于质量乘以速度，在封闭系统中守恒。"
          },
          {
            "text": "弹性碰撞动能守恒，非弹性碰撞动能有损失。"
          },
          {
            "text": "希望通过这个实验，你对碰撞与动量有了更深入的理解！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "冲量与动量定理",
        "description": "了解力与动量变化的关系"
      },
      {
        "title": "粒子物理中的碰撞",
        "description": "探索高能物理实验中的碰撞研究"
      }
    ]
  },
  {
    "slug": "circular-motion",
    "title": "圆周运动与向心力",
    "subtitle": "探索物体做匀速圆周运动的奥秘",
    "category": "力学",
    "difficulty": "intermediate",
    "targetAge": "14-17岁",
    "sourcePath": "/circular-motion",
    "sourceChunk": "CircularMotionExperiment-BbDgoURM.js",
    "objectives": [
      "理解线速度、角速度与周期的关系",
      "掌握向心加速度与向心力公式",
      "认识向心力的方向始终指向圆心"
    ],
    "prerequisites": [
      "牛顿第二定律",
      "矢量基础"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到圆周运动实验！从旋转的摩天轮到绕地球飞行的卫星，圆周运动无处不在。"
          },
          {
            "text": "一个物体沿圆形轨道运动时，即使速度大小不变，它的运动方向也在时刻改变。"
          },
          {
            "text": "今天我们就来揭示，是什么力让物体一直绕着圆心转，而不会飞出去。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "物体做匀速圆周运动时，线速度的大小不变，但方向始终沿圆的切线。"
          },
          {
            "text": "角速度 ω 描述转动的快慢，表示单位时间内转过的角度。"
          },
          {
            "text": "线速度 v 与角速度 ω 的关系是 v 等于 ω 乘以半径 r。"
          },
          {
            "text": "转一圈所用的时间叫做周期 T，它与角速度互为倒数关系。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "向心加速度指向圆心，大小等于 v 平方除以 r，也等于 ω 平方乘以 r。",
            "formula": "a = \\frac{v^2}{r} = \\omega^2 r"
          },
          {
            "text": "根据牛顿第二定律，向心力等于质量乘以向心加速度。",
            "formula": "F = \\frac{mv^2}{r} = m\\omega^2 r"
          },
          {
            "text": "关键在于：向心力的方向始终指向圆心，它只改变速度方向，不改变速度大小。"
          },
          {
            "text": "一旦向心力消失，物体就会沿切线方向飞出，这就是离心现象。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "试着增大角速度，你会看到向心力明显变大，因为力与 ω 的平方成正比。"
          },
          {
            "text": "再调整半径，观察向心力和线速度如何随之改变。"
          },
          {
            "text": "注意画面中那条始终指向圆心的红色箭头，它就是向心力。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "汽车转弯时，地面摩擦力提供向心力；弯道设计成倾斜，正是为了帮助提供向心力。"
          },
          {
            "text": "人造卫星绕地球飞行，万有引力恰好充当向心力。"
          },
          {
            "text": "洗衣机脱水时，衣物被甩向桶壁，水却从孔中飞出，这正是向心力不足的离心现象。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "匀速圆周运动中，线速度大小不变，方向沿切线时刻改变。"
          },
          {
            "text": "向心加速度 a 等于 v 平方除以 r，向心力 F 等于 m v 平方除以 r。"
          },
          {
            "text": "向心力永远指向圆心，是维持圆周运动的关键。希望你已经掌握了它！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "万有引力与卫星运动",
        "description": "向心力如何维持卫星绕地球运行"
      },
      {
        "title": "离心现象",
        "description": "洗衣机脱水与向心力的关系"
      }
    ]
  },
  {
    "slug": "inclined-plane",
    "title": "斜面与摩擦",
    "subtitle": "探索斜面上的力分解与摩擦临界角",
    "category": "力学",
    "difficulty": "intermediate",
    "targetAge": "14-17岁",
    "sourcePath": "/inclined-plane",
    "sourceChunk": "InclinedPlaneExperiment-CzTY-8X3.js",
    "objectives": [
      "理解斜面上重力的分解",
      "区分静摩擦与滑动摩擦",
      "掌握滑动临界角 tanθ = μ"
    ],
    "prerequisites": [
      "力的分解",
      "牛顿第二定律",
      "摩擦力概念"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到斜面与摩擦实验！斜面是最古老的简单机械之一，从金字塔到盘山公路都有它的身影。"
          },
          {
            "text": "一个物块放在斜面上，什么时候静止，什么时候开始下滑？这背后是力与摩擦的较量。"
          },
          {
            "text": "今天我们就来分解斜面上的力，找出物块滑动的临界条件。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "物块受到的重力可以分解为沿斜面向下和垂直斜面两个分量。"
          },
          {
            "text": "沿斜面的分量 mg sinθ 是推动物块下滑的力。"
          },
          {
            "text": "垂直斜面的分量 mg cosθ 决定了物块对斜面的压力，也决定了最大摩擦力。"
          },
          {
            "text": "只要下滑分量不超过最大静摩擦力，物块就保持静止。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "下滑力等于 mg sinθ，最大静摩擦力等于 μ 乘以 mg cosθ。",
            "formula": "f_{max} = \\mu mg\\cos\\theta"
          },
          {
            "text": "当下滑力恰好等于最大静摩擦力时，对应的角度就是临界角。"
          },
          {
            "text": "令两者相等，约去 mg cosθ，得到临界角的正切等于摩擦系数。",
            "formula": "\\tan\\theta_c = \\mu"
          },
          {
            "text": "一旦角度超过临界角，物块加速下滑，加速度等于 g 乘以括号 sinθ 减 μcosθ。",
            "formula": "a = g(\\sin\\theta - \\mu\\cos\\theta)"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "慢慢增大斜面倾角，观察下滑力箭头如何变长，摩擦力箭头如何变短。"
          },
          {
            "text": "当倾角超过临界角的瞬间，物块开始滑动，状态从静止变为加速。"
          },
          {
            "text": "调整摩擦系数，看看临界角如何随之改变，摩擦越大临界角越大。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "盘山公路修成缓坡，正是为了减小下滑分量，让车辆更安全。"
          },
          {
            "text": "传送带、滑梯的倾角设计，都要考虑摩擦临界角。"
          },
          {
            "text": "螺纹和楔块利用小倾角实现自锁，让它们紧固后不会自己松开。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "斜面上重力分解为下滑分量 mg sinθ 和压力分量 mg cosθ。"
          },
          {
            "text": "滑动临界角满足 tanθc 等于摩擦系数 μ。"
          },
          {
            "text": "超过临界角后加速度为 g 乘以 sinθ 减 μcosθ。希望你已经掌握了斜面的奥秘！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "盘山公路的坡度设计",
        "description": "为什么山路要修成盘旋的缓坡"
      },
      {
        "title": "摩擦角与自锁",
        "description": "螺纹与楔块的自锁原理"
      }
    ]
  },
  {
    "slug": "pulley-system",
    "title": "滑轮组与机械效率",
    "subtitle": "用力的代价换取省力的智慧",
    "category": "力学",
    "difficulty": "intermediate",
    "targetAge": "14-17岁",
    "sourcePath": "/pulley-system",
    "sourceChunk": "PulleySystemExperiment-SXBZeFwM.js",
    "objectives": [
      "理解定滑轮与动滑轮的作用",
      "掌握滑轮组省力规律 F = G/n",
      "理解机械效率的概念与计算"
    ],
    "prerequisites": [
      "功与功率",
      "杠杆原理"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到滑轮组实验！要把沉重的货物吊上高楼，工人靠的就是滑轮组。"
          },
          {
            "text": "一个人为什么能拉起比自己重得多的物体？秘密就藏在滑轮的组合里。"
          },
          {
            "text": "但省力从来不是免费的，今天我们就来看看其中的代价与效率。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "定滑轮固定不动，只改变力的方向，不省力。"
          },
          {
            "text": "动滑轮随物体一起移动，能省一半的力，但要多拉一倍的绳子。"
          },
          {
            "text": "把定滑轮和动滑轮组合起来，就是滑轮组，可以同时省力又改变方向。"
          },
          {
            "text": "有几段绳子吊着动滑轮，拉力就变成物重的几分之一。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "理想情况下，拉力等于物重除以承重绳子的段数 n。",
            "formula": "F = \\frac{G}{n}"
          },
          {
            "text": "但绳子拉动的距离是物体上升高度的 n 倍，这就是省力费距离。"
          },
          {
            "text": "机械效率等于有用功除以总功，反映了机械的能量利用率。",
            "formula": "\\eta = \\frac{W_{有用}}{W_{总}} = \\frac{Gh}{Fs}"
          },
          {
            "text": "由于动滑轮自重和摩擦消耗了额外的功，实际效率总是小于百分之百。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "增加承重绳段数 n，观察拉力如何减小，但拉绳距离相应增大。"
          },
          {
            "text": "调整动滑轮的重量，看看它如何拉低机械效率。"
          },
          {
            "text": "动滑轮越重、物体越轻，额外消耗占比越大，效率越低。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "塔吊和起重机用多组滑轮，让小电机也能吊起几十吨的重物。"
          },
          {
            "text": "攀岩和救援中的省力系统，也是滑轮组原理的应用。"
          },
          {
            "text": "工程师设计时会尽量减小滑轮自重和摩擦，以提高机械效率。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "滑轮组用 n 段绳子承重，理想拉力为物重的 n 分之一。"
          },
          {
            "text": "省力必定费距离，机械效率等于有用功除以总功。"
          },
          {
            "text": "动滑轮自重和摩擦让效率小于百分之百。希望你领会了省力背后的智慧！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "起重机的滑轮组",
        "description": "工程机械如何吊起重物"
      },
      {
        "title": "功的原理",
        "description": "为什么省力必定费距离"
      }
    ]
  },
  {
    "slug": "forced-oscillation",
    "title": "受迫振动与共振",
    "subtitle": "当驱动频率逼近固有频率，振幅为何骤增",
    "category": "力学",
    "difficulty": "advanced",
    "targetAge": "16-18岁",
    "sourcePath": "/forced-oscillation",
    "sourceChunk": "ForcedOscillationExperiment-mx8FmcAc.js",
    "objectives": [
      "理解受迫振动的稳态特性",
      "掌握共振条件与振幅-频率曲线",
      "认识阻尼对共振峰的影响"
    ],
    "prerequisites": [
      "简谐振动",
      "固有频率",
      "阻尼振动"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到受迫振动实验！荡秋千时，只要在恰当的时机推一把，秋千就越荡越高。"
          },
          {
            "text": "这背后是一个强大的现象：共振。当驱动的节奏踩准了系统的固有频率，能量会高效积累。"
          },
          {
            "text": "今天我们就来看看，驱动频率如何决定振幅，以及共振是如何发生的。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "在周期性外力的持续驱动下，系统的振动叫做受迫振动。"
          },
          {
            "text": "经过一段时间后，系统会以驱动力的频率做稳定的振动，称为稳态。"
          },
          {
            "text": "稳态振幅的大小，取决于驱动频率与系统固有频率的接近程度。"
          },
          {
            "text": "当驱动频率接近固有频率时，振幅急剧增大，这就是共振。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "受迫振动满足含驱动力的运动方程。",
            "formula": "m\\ddot{x} + c\\dot{x} + kx = F_0\\cos\\omega t"
          },
          {
            "text": "稳态振幅随驱动频率变化，表达式如下。",
            "formula": "A(\\omega) = \\frac{F_0}{\\sqrt{(k - m\\omega^2)^2 + (c\\omega)^2}}"
          },
          {
            "text": "当驱动频率等于固有频率 ω₀ 时，分母最小，振幅达到峰值。"
          },
          {
            "text": "阻尼越小，共振峰越高越尖锐；阻尼越大，峰越低越平缓。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "缓慢调整驱动频率，观察振幅如何在固有频率附近冲上峰顶。"
          },
          {
            "text": "增大阻尼，你会看到共振峰被压低、变宽。"
          },
          {
            "text": "注意共振曲线的形状，它直观地展示了系统对不同频率的响应。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "收音机调谐就是利用电路共振，从众多电波中选出想听的电台。"
          },
          {
            "text": "乐器的共鸣箱通过共振放大声音，让音色更加饱满。"
          },
          {
            "text": "但共振也可能带来灾难，著名的塔科马大桥就因风致共振而坍塌。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "受迫振动稳态时以驱动频率振动，振幅由驱动频率与固有频率的接近度决定。"
          },
          {
            "text": "当驱动频率接近固有频率时发生共振，振幅达到峰值。"
          },
          {
            "text": "阻尼决定共振峰的高低与宽窄。共振既能为我所用，也需小心防范。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "塔科马大桥",
        "description": "共振导致的著名桥梁坍塌事件"
      },
      {
        "title": "收音机调谐",
        "description": "电路共振如何选出电台频率"
      }
    ]
  },
  {
    "slug": "coriolis-force",
    "title": "科里奥利力",
    "subtitle": "旋转参考系中的神秘偏转力",
    "category": "力学",
    "difficulty": "intermediate",
    "targetAge": "16-17岁",
    "sourcePath": "/coriolis-force",
    "sourceChunk": "CoriolisForceExperiment-D9Zo8IbY.js",
    "objectives": [
      "理解旋转参考系中的惯性力",
      "掌握科里奥利力的方向判断",
      "认识它对气旋与洋流的影响"
    ],
    "prerequisites": [
      "参考系",
      "圆周运动",
      "惯性力"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎认识科里奥利力！它是一种只在旋转世界里才出现的奇特的力。"
          },
          {
            "text": "在旋转的圆盘上直线投球，球却会神秘地拐弯。"
          },
          {
            "text": "地球本身就是一个旋转的圆盘，这股力塑造了风暴和洋流。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "科里奥利力不是真实的力，而是旋转参考系带来的惯性效应。"
          },
          {
            "text": "在旋转圆盘上看，匀速直线运动的物体会偏离直线。"
          },
          {
            "text": "北半球向右偏，南半球向左偏，方向由自转决定。"
          },
          {
            "text": "它垂直于物体的速度，只改变方向，不改变速率。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "科里奥利加速度等于二倍角速度叉乘速度。",
            "formula": "\\vec{a}_C = -2\\,\\vec{\\omega}\\times\\vec{v}"
          },
          {
            "text": "角速度越大、速度越快，偏转就越明显。"
          },
          {
            "text": "因为力始终垂直速度，所以轨迹弯成弧线。"
          },
          {
            "text": "它的大小与物体质量成正比。",
            "formula": "F_C = 2m\\omega v"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调节圆盘转速，观察球的偏转弧度变化。"
          },
          {
            "text": "改变球的初速度，看轨迹如何随之弯曲。"
          },
          {
            "text": "切换旋转方向，体会偏转方向的反转。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "科里奥利力让北半球的气旋逆时针旋转。"
          },
          {
            "text": "它影响洋流、信风，乃至远程炮弹的弹道修正。"
          },
          {
            "text": "傅科摆的缓慢转动，正是地球自转的直接证据。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "科里奥利力是旋转参考系中的惯性力，使运动物体偏转。"
          },
          {
            "text": "北半球右偏、南半球左偏，aC=-2ω×v。"
          },
          {
            "text": "它塑造了地球的天气与洋流。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "气旋的旋转方向",
        "description": "南北半球为何相反"
      },
      {
        "title": "傅科摆",
        "description": "证明地球自转的实验"
      }
    ]
  },
  {
    "slug": "gyroscope",
    "title": "陀螺进动",
    "subtitle": "角动量守恒下的奇妙旋转",
    "category": "力学",
    "difficulty": "advanced",
    "targetAge": "16-17岁",
    "sourcePath": "/gyroscope",
    "sourceChunk": "GyroscopeExperiment-DkHWoFTl.js",
    "objectives": [
      "理解角动量与力矩",
      "掌握进动角速度公式",
      "认识陀螺仪的应用"
    ],
    "prerequisites": [
      "角动量",
      "力矩",
      "转动惯量"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到陀螺的世界！高速旋转的陀螺为何不会倒下？"
          },
          {
            "text": "它不仅不倒，转轴还会缓缓画圈，这叫进动。"
          },
          {
            "text": "这背后是角动量守恒的奇妙物理。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "旋转的陀螺拥有沿转轴方向的角动量。"
          },
          {
            "text": "重力对陀螺产生一个力矩，试图让它倒下。"
          },
          {
            "text": "但力矩不会改变角动量大小，只改变它的方向。"
          },
          {
            "text": "于是转轴绕竖直方向缓缓旋转，形成进动。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "力矩等于角动量的变化率。",
            "formula": "\\vec{\\tau} = \\dfrac{d\\vec{L}}{dt}"
          },
          {
            "text": "进动角速度由重力矩与自转角动量之比决定。",
            "formula": "\\Omega = \\dfrac{mgr}{I\\omega}"
          },
          {
            "text": "自转越快，进动越慢，陀螺越稳。"
          },
          {
            "text": "这就是为什么高速陀螺几乎竖直站立。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调节自转角速度，观察进动快慢的变化。"
          },
          {
            "text": "改变倾角与重心距离，看进动如何响应。"
          },
          {
            "text": "注意自转越快，进动越慢的反比关系。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "陀螺仪是飞机、火箭和手机的姿态传感器。"
          },
          {
            "text": "惯性导航靠陀螺仪在没有信号时确定方向。"
          },
          {
            "text": "地轴的两万六千年岁差，也是一种进动。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "旋转陀螺在重力矩作用下发生进动而非倒下。"
          },
          {
            "text": "进动角速度 Ω=mgr/(Iω)，自转越快进动越慢。"
          },
          {
            "text": "它是导航与天文中的核心现象。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "陀螺仪导航",
        "description": "飞机与航天器的姿态控制"
      },
      {
        "title": "地球的岁差",
        "description": "地轴的缓慢进动"
      }
    ]
  },
  {
    "slug": "coulomb-law",
    "title": "库仑定律",
    "subtitle": "探索点电荷之间的静电力",
    "category": "电磁学",
    "difficulty": "intermediate",
    "targetAge": "15-18岁",
    "sourcePath": "/coulomb-law",
    "sourceChunk": "CoulombLawExperiment-D5oUg83h.js",
    "objectives": [
      "理解库仑定律的内容",
      "掌握静电力的计算方法",
      "观察电荷量和距离对静电力的影响"
    ],
    "prerequisites": [
      "电荷的基本概念",
      "力的合成与分解"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到库仑定律实验！今天我们要探索电荷之间的相互作用。"
          },
          {
            "text": "库仑定律是电磁学的基础，描述了点电荷之间的静电力。"
          },
          {
            "text": "这个定律由法国物理学家库仑在 1785 年通过扭秤实验发现。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "电荷分为正电荷和负电荷，同种电荷相斥，异种电荷相吸。"
          },
          {
            "text": "库仑定律说：两个点电荷之间的静电力与电荷量的乘积成正比，与距离的平方成反比。"
          },
          {
            "text": "静电力的方向沿着两电荷的连线，是一种有心力。"
          },
          {
            "text": "库仑定律的形式与万有引力定律非常相似，都是平方反比定律。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "库仑定律的公式是 F 等于 k 乘以 q1 乘以 q2 除以 r 的平方。",
            "formula": "F = k\\frac{q_1 q_2}{r^2}"
          },
          {
            "text": "其中 k 是库仑常数，约等于 9 乘以 10 的 9 次方牛顿平方米每库仑平方。",
            "formula": "k \\approx 9 \\times 10^9 \\, \\text{N}\\cdot\\text{m}^2/\\text{C}^2"
          },
          {
            "text": "q1 和 q2 是两个电荷的电荷量，r 是它们之间的距离。"
          },
          {
            "text": "当 F 为正时表示斥力，F 为负时表示引力。"
          }
        ]
      },
      {
        "id": "animation",
        "title": "动画演示",
        "lines": [
          {
            "text": "图中显示了两个点电荷，红色表示正电荷，蓝色表示负电荷。"
          },
          {
            "text": "箭头表示静电力的方向和大小，箭头越长表示力越大。"
          },
          {
            "text": "你可以拖动电荷改变它们的位置，观察力的变化。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调整电荷量滑块，观察静电力如何变化。"
          },
          {
            "text": "电荷量越大，静电力越大。"
          },
          {
            "text": "改变电荷的正负，观察力的方向变化。"
          },
          {
            "text": "拉近或拉远两个电荷，验证平方反比关系。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "库仑定律是理解电磁现象的基础。"
          },
          {
            "text": "静电复印机利用静电力吸附墨粉到纸张上。"
          },
          {
            "text": "原子中电子与原子核之间的库仑力决定了原子的结构。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "让我们总结一下今天学到的内容。"
          },
          {
            "text": "库仑定律描述了点电荷之间的静电力，与电荷量乘积成正比，与距离平方成反比。"
          },
          {
            "text": "同种电荷相斥，异种电荷相吸。"
          },
          {
            "text": "希望通过这个实验，你对库仑定律有了更深入的理解！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "电场与电势",
        "description": "了解电场的概念和电势能"
      },
      {
        "title": "高斯定律",
        "description": "探索电场的另一种描述方式"
      }
    ]
  },
  {
    "slug": "electric-field",
    "title": "电场可视化",
    "subtitle": "探索电场线和等势线的分布",
    "category": "电磁学",
    "difficulty": "advanced",
    "targetAge": "大学本科",
    "sourcePath": "/electric-field",
    "sourceChunk": "ElectricFieldExperiment-BnUGWwgj.js",
    "objectives": [
      "理解电场的概念和性质",
      "掌握电场线和等势线的绘制方法",
      "观察不同电荷分布产生的电场"
    ],
    "prerequisites": [
      "库仑定律",
      "向量运算"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到电场可视化实验！今天我们要探索电场的奥秘。"
          },
          {
            "text": "电场是电荷周围存在的一种物质，它对放入其中的电荷产生力的作用。"
          },
          {
            "text": "法拉第首先提出了电场线的概念，使抽象的电场变得可视化。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "电场强度 E 定义为单位正电荷在该点受到的电场力。"
          },
          {
            "text": "电场线是一组曲线，其切线方向表示该点电场强度的方向。"
          },
          {
            "text": "电场线从正电荷出发，终止于负电荷，不会相交。"
          },
          {
            "text": "等势线是电势相等的点连成的线，与电场线垂直。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "点电荷产生的电场强度 E 等于 k 乘以 q 除以 r 的平方。",
            "formula": "E = k\\frac{q}{r^2}"
          },
          {
            "text": "电场强度是矢量，多个电荷产生的电场遵循叠加原理。"
          },
          {
            "text": "电势 V 等于 k 乘以 q 除以 r，是标量。",
            "formula": "V = k\\frac{q}{r}"
          },
          {
            "text": "电场强度与电势的关系是 E 等于负的电势梯度。"
          }
        ]
      },
      {
        "id": "animation",
        "title": "动画演示",
        "lines": [
          {
            "text": "图中显示了电荷产生的电场线，从正电荷发出，指向负电荷。"
          },
          {
            "text": "电场线越密集的地方，电场强度越大。"
          },
          {
            "text": "等势线用虚线表示，与电场线处处垂直。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "你可以添加或移除电荷，观察电场的变化。"
          },
          {
            "text": "尝试放置一对正负电荷，形成电偶极子的电场。"
          },
          {
            "text": "放置两个同种电荷，观察它们之间的电场分布。"
          },
          {
            "text": "切换显示模式，可以只看电场线或只看等势线。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "电场的概念在电子学和电磁学中非常重要。"
          },
          {
            "text": "电容器利用均匀电场储存电能。"
          },
          {
            "text": "粒子加速器利用电场加速带电粒子。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "让我们总结一下今天学到的内容。"
          },
          {
            "text": "电场是电荷周围的物质，用电场强度描述其大小和方向。"
          },
          {
            "text": "电场线表示电场方向，等势线与电场线垂直。"
          },
          {
            "text": "希望通过这个实验，你对电场有了更直观的理解！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "高斯定律",
        "description": "了解电通量和高斯定律"
      },
      {
        "title": "电势与电势能",
        "description": "探索电势的物理意义"
      }
    ]
  },
  {
    "slug": "electric-field-3d",
    "title": "三维电场与电势",
    "subtitle": "在立体空间中观察电场线、试探电荷与等势面",
    "category": "电磁学",
    "difficulty": "advanced",
    "targetAge": "大学本科",
    "sourcePath": "/electric-field-3d",
    "sourceChunk": "ElectricField3DExperiment-BVV2YOL7.js",
    "objectives": [
      "在三维空间中建立电场的直观图像",
      "理解电场线、等势面与试探电荷运动的关系",
      "掌握电场（矢量）与电势（标量）的联系"
    ],
    "prerequisites": [
      "库仑定律",
      "矢量与梯度"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到三维电场实验！这次我们走出平面，在立体空间中观察电场。"
          },
          {
            "text": "你可以拖动旋转视角，从任意方向欣赏电场的空间结构。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "电场线是一族空间曲线，切线方向即该点电场强度的方向。"
          },
          {
            "text": "电场线从正电荷发出，终止于负电荷，在三维空间中向四面八方铺展。"
          },
          {
            "text": "电场线越密，电场越强。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "点电荷电场强度沿径向，大小与距离平方成反比。",
            "formula": "\\vec{E} = k\\frac{q}{r^2}\\hat{r}"
          },
          {
            "text": "电势是标量，等于 k 乘以 q 除以 r。",
            "formula": "V = k\\frac{q}{r}"
          },
          {
            "text": "电场是电势的负梯度，因此电场线总是垂直穿过等势面。",
            "formula": "\\vec{E} = -\\nabla V"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "切换到“试探电荷”模式，绿色小球会沿电场力被推动，直观显示力的方向。"
          },
          {
            "text": "切换到“等势面”模式，半透明球壳就是电势相等的曲面。"
          },
          {
            "text": "尝试增删电荷、组成电偶极子或同号电荷，观察空间电场如何变化。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "三维电场分析是设计电容器、传感器与粒子加速器的基础。"
          },
          {
            "text": "等势面的概念在静电屏蔽与高压设备绝缘中至关重要。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "我们在三维空间里看清了电场线、等势面与试探电荷三者的关系。"
          },
          {
            "text": "记住：电场是矢量、电势是标量，电场线永远垂直于等势面。"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "高斯定律",
        "description": "用通量描述空间电场"
      },
      {
        "title": "电偶极子",
        "description": "一对正负电荷的经典电场结构"
      }
    ]
  },
  {
    "slug": "magnetic-field",
    "title": "磁场可视化",
    "subtitle": "探索电流产生的磁场分布",
    "category": "电磁学",
    "difficulty": "advanced",
    "targetAge": "大学本科",
    "sourcePath": "/magnetic-field",
    "sourceChunk": "MagneticFieldExperiment-DNQlxjxX.js",
    "objectives": [
      "理解磁场的基本概念",
      "掌握安培定则",
      "观察不同电流分布产生的磁场"
    ],
    "prerequisites": [
      "电流的概念",
      "向量运算"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到磁场可视化实验！今天我们要探索电流与磁场的关系。"
          },
          {
            "text": "1820年，奥斯特发现电流能使磁针偏转，揭示了电与磁的联系。"
          },
          {
            "text": "这一发现开启了电磁学的新纪元。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "磁场是电流周围存在的一种物质，用磁感应强度 B 描述。"
          },
          {
            "text": "磁力线是闭合曲线，从 N 极出发，进入 S 极。"
          },
          {
            "text": "安培定则（右手螺旋定则）可以判断电流产生磁场的方向。"
          },
          {
            "text": "直线电流周围的磁力线是以导线为轴的同心圆。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "直线电流产生的磁场 B 等于 μ0 乘以 I 除以 2πr。",
            "formula": "B = \\frac{\\mu_0 I}{2\\pi r}"
          },
          {
            "text": "其中 μ0 是真空磁导率，I 是电流，r 是到导线的距离。"
          },
          {
            "text": "圆形线圈中心的磁场 B 等于 μ0 乘以 I 除以 2R。",
            "formula": "B = \\frac{\\mu_0 I}{2R}"
          },
          {
            "text": "螺线管内部的磁场近似均匀，B 等于 μ0 乘以 n 乘以 I。"
          }
        ]
      },
      {
        "id": "animation",
        "title": "动画演示",
        "lines": [
          {
            "text": "图中显示了电流产生的磁力线分布。"
          },
          {
            "text": "磁力线越密集的地方，磁场越强。"
          },
          {
            "text": "用右手握住导线，拇指指向电流方向，四指弯曲方向就是磁场方向。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调整电流大小，观察磁场强度的变化。"
          },
          {
            "text": "切换不同的电流分布模式：直线电流、圆形线圈、螺线管。"
          },
          {
            "text": "改变电流方向，观察磁场方向的变化。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "电磁铁利用电流产生磁场，广泛应用于电机和继电器。"
          },
          {
            "text": "MRI 核磁共振成像利用强磁场进行医学诊断。"
          },
          {
            "text": "磁悬浮列车利用电磁力实现悬浮和推进。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "让我们总结一下今天学到的内容。"
          },
          {
            "text": "电流周围存在磁场，方向由安培定则确定。"
          },
          {
            "text": "磁场强度与电流成正比，与距离成反比。"
          },
          {
            "text": "希望通过这个实验，你对磁场有了更直观的理解！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "电磁感应",
        "description": "了解变化磁场产生电场"
      },
      {
        "title": "麦克斯韦方程组",
        "description": "探索电磁学的统一理论"
      }
    ]
  },
  {
    "slug": "lorentz-force",
    "title": "带电粒子在电磁场中的运动",
    "subtitle": "洛伦兹力与回旋、螺旋轨迹",
    "category": "电磁学",
    "difficulty": "advanced",
    "targetAge": "高中至大学",
    "sourcePath": "/lorentz-force",
    "sourceChunk": "LorentzForceExperiment-CL30CgHx.js",
    "objectives": [
      "理解洛伦兹力的方向与大小",
      "掌握带电粒子在磁场中的圆周与螺旋运动",
      "认识回旋半径与回旋周期"
    ],
    "prerequisites": [
      "磁场",
      "向量叉乘",
      "圆周运动"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到带电粒子运动实验！我们将在三维空间中追踪一个带电粒子的轨迹。"
          },
          {
            "text": "紫色箭头是磁场，绿色箭头是电场，黄色曲线就是粒子走过的路径。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "洛伦兹力",
        "lines": [
          {
            "text": "运动的带电粒子在磁场中受到洛伦兹力，方向垂直于速度和磁场。"
          },
          {
            "text": "由于力始终垂直于速度，磁场不做功，只改变运动方向。"
          },
          {
            "text": "速度垂直磁场的分量让粒子做圆周运动，平行分量让圆周沿磁场平移。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "洛伦兹力等于电场力加上磁场力。",
            "formula": "\\vec{F} = q\\vec{E} + q\\vec{v}\\times\\vec{B}"
          },
          {
            "text": "回旋半径与垂直速度成正比，与磁场和电荷成反比。",
            "formula": "r = \\frac{mv_\\perp}{|q|B}"
          },
          {
            "text": "回旋周期只取决于磁场和荷质比，与速度无关。",
            "formula": "T = \\frac{2\\pi m}{|q|B}"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "动手探索",
        "lines": [
          {
            "text": "把平行速度调为零，粒子就做纯圆周运动。"
          },
          {
            "text": "增大平行速度，圆周被拉成螺旋，螺距随之变大。"
          },
          {
            "text": "改变磁场强度，回旋半径随之变化；切换电荷符号，旋转方向相反。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "回旋加速器和质谱仪都利用磁场让带电粒子做圆周运动。"
          },
          {
            "text": "地球磁场使太阳风粒子沿磁力线螺旋运动，形成绚丽的极光。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "磁场中带电粒子的运动是圆周与匀速直线的叠加，合成螺旋线。"
          },
          {
            "text": "记住：磁场不做功，回旋周期与速度无关。"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "回旋加速器",
        "description": "利用磁场加速粒子的装置"
      },
      {
        "title": "磁镜与磁约束",
        "description": "聚变中约束等离子体的原理"
      }
    ]
  },
  {
    "slug": "rc-circuit",
    "title": "RC 电路充放电",
    "subtitle": "探索电容器充电与放电的指数规律",
    "category": "电磁学",
    "difficulty": "intermediate",
    "targetAge": "16-18岁",
    "sourcePath": "/rc-circuit",
    "sourceChunk": "RCCircuitExperiment-BkpQN1CU.js",
    "objectives": [
      "理解电容器充放电的指数规律",
      "掌握时间常数 τ = RC 的物理意义",
      "认识电压、电流随时间的变化关系"
    ],
    "prerequisites": [
      "电容概念",
      "欧姆定律",
      "指数函数"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到 RC 电路实验！电容器就像一个小水库，可以储存和释放电荷。"
          },
          {
            "text": "当我们把电容器接到电源上，它会逐渐充满电；断开电源接通电阻，它又会慢慢放电。"
          },
          {
            "text": "这个充放电过程不是瞬间完成的，而是遵循优美的指数规律。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "RC 电路由一个电阻 R 和一个电容 C 串联组成。"
          },
          {
            "text": "充电时，电流从电源流向电容，电容两端电压逐渐升高，趋近电源电压。"
          },
          {
            "text": "放电时，电容储存的电荷通过电阻释放，电压逐渐降到零。"
          },
          {
            "text": "电阻越大或电容越大，充放电就越慢，这由时间常数 τ 决定。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "时间常数 τ 等于 R 乘以 C，它决定了充放电的快慢。",
            "formula": "\\tau = RC"
          },
          {
            "text": "充电时，电容电压随时间按指数规律上升。",
            "formula": "U_C = U_0(1 - e^{-t/\\tau})"
          },
          {
            "text": "放电时，电容电压随时间按指数规律衰减。",
            "formula": "U_C = U_0 e^{-t/\\tau}"
          },
          {
            "text": "经过一个时间常数 τ，充电达到约 63%，放电降到约 37%。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "试着增大电阻 R，你会看到充电曲线变得更平缓，需要更长时间充满。"
          },
          {
            "text": "增大电容 C 也有类似效果，因为时间常数 τ 等于 R 乘以 C。"
          },
          {
            "text": "点击充电或放电按钮，观察电压曲线和电流的实时变化。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "RC 电路在电子设备中无处不在。它可以做成滤波器，滤除信号中的噪声。"
          },
          {
            "text": "相机闪光灯就利用电容快速储能再瞬间放电，产生强光。"
          },
          {
            "text": "555 定时器芯片用 RC 充放电来产生精确的时间延迟和脉冲信号。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "RC 电路的充放电遵循指数规律，由时间常数 τ 等于 RC 决定快慢。"
          },
          {
            "text": "经过一个 τ，充电达到 63%，放电降到 37%；约 5 个 τ 后基本完成。"
          },
          {
            "text": "这个简单的电路是现代电子技术的基石。希望你已经理解了它的原理！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "滤波电路",
        "description": "RC 电路如何用于信号滤波"
      },
      {
        "title": "定时电路",
        "description": "555 定时器中的 RC 充放电应用"
      }
    ]
  },
  {
    "slug": "electromagnetic-induction",
    "title": "电磁感应与楞次定律",
    "subtitle": "磁铁穿过线圈，探索感应电流的奥秘",
    "category": "电磁学",
    "difficulty": "intermediate",
    "targetAge": "15-18岁",
    "sourcePath": "/electromagnetic-induction",
    "sourceChunk": "ElectromagneticInductionExperiment-CzXiKwa9.js",
    "objectives": [
      "理解电磁感应现象与磁通量变化",
      "掌握法拉第电磁感应定律 ε = -N dΦ/dt",
      "运用楞次定律判断感应电流方向"
    ],
    "prerequisites": [
      "磁场与磁感线",
      "磁通量概念"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到电磁感应实验！1831 年，法拉第发现了一个改变世界的现象。"
          },
          {
            "text": "当磁铁靠近或离开一个线圈时，线圈里竟然产生了电流，而它并没有连接电源。"
          },
          {
            "text": "这个发现催生了发电机和现代电力系统，今天我们就来一探究竟。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "穿过线圈的磁感线条数，用磁通量 Φ 来描述，等于磁感应强度乘以面积。"
          },
          {
            "text": "只有当磁通量发生变化时，线圈中才会产生感应电流。"
          },
          {
            "text": "磁铁运动得越快，磁通量变化越快，感应电流就越强。"
          },
          {
            "text": "磁铁静止不动时，磁通量不变，即使磁场很强也没有感应电流。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "法拉第定律指出，感应电动势等于磁通量变化率的负值，再乘以匝数 N。",
            "formula": "\\varepsilon = -N\\frac{d\\Phi}{dt}"
          },
          {
            "text": "公式中的负号正是楞次定律的体现。"
          },
          {
            "text": "楞次定律说：感应电流的方向总是阻碍引起它的磁通量变化。"
          },
          {
            "text": "磁铁靠近时，线圈排斥它；磁铁远离时，线圈吸引它，始终在反抗变化。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "拖动磁铁靠近线圈，观察电流表指针的偏转方向。"
          },
          {
            "text": "加快磁铁的速度，你会看到感应电流明显增大。"
          },
          {
            "text": "把磁铁抽离时，注意电流方向反了过来，这正是楞次定律的预言。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "发电机就是电磁感应的直接应用，旋转的线圈不断切割磁感线产生电流。"
          },
          {
            "text": "变压器利用互感原理，改变交流电的电压。"
          },
          {
            "text": "电磁炉、无线充电、电磁制动，都离不开电磁感应。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "电磁感应的本质是磁通量变化产生感应电动势。"
          },
          {
            "text": "法拉第定律 ε 等于负 N 乘以 dΦ/dt，楞次定律决定电流方向，阻碍磁通量变化。"
          },
          {
            "text": "从法拉第的小线圈到遍布世界的发电厂，这个原理点亮了现代文明。希望你已经掌握！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "发电机原理",
        "description": "电磁感应如何把机械能转为电能"
      },
      {
        "title": "涡流与电磁制动",
        "description": "感应电流的能量耗散应用"
      }
    ]
  },
  {
    "slug": "capacitor",
    "title": "平行板电容器",
    "subtitle": "储存电荷与电场能的元件",
    "category": "电磁学",
    "difficulty": "intermediate",
    "targetAge": "15-18岁",
    "sourcePath": "/capacitor",
    "sourceChunk": "CapacitorExperiment-BoKkUaWJ.js",
    "objectives": [
      "理解电容的概念",
      "掌握平行板电容器的电容公式",
      "认识电容器的储能"
    ],
    "prerequisites": [
      "电场",
      "电势差",
      "电荷"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到平行板电容器实验！电容器是电路中最基本的元件之一，专门用来储存电荷。"
          },
          {
            "text": "从相机闪光灯到电脑主板，处处都有电容器的身影。"
          },
          {
            "text": "今天我们就来看看，两块平行金属板是如何储存电荷与电场能的。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "平行板电容器由两块靠得很近的平行金属板组成。"
          },
          {
            "text": "接上电源后，两板分别带上等量异号的电荷。"
          },
          {
            "text": "电容描述电容器储存电荷的能力，等于电荷量除以电压。"
          },
          {
            "text": "板间形成均匀电场，电场强度等于电压除以板间距。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "平行板电容器的电容由几何与介质决定。",
            "formula": "C = \\frac{\\varepsilon_0 \\varepsilon_r S}{d}"
          },
          {
            "text": "正对面积越大、板间距越小、介电常数越大，电容就越大。"
          },
          {
            "text": "板间电场是均匀的，强度等于电压除以间距。",
            "formula": "E = \\frac{U}{d}"
          },
          {
            "text": "电容器储存的电场能与电压平方成正比。",
            "formula": "W = \\frac{1}{2}CU^2"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "减小板间距，观察电容和电场强度如何增大。"
          },
          {
            "text": "增大正对面积，电容随之增大，储存更多电荷。"
          },
          {
            "text": "提高电压，储能按电压平方迅速增加。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "相机闪光灯用电容器快速储能再瞬间释放，产生强光。"
          },
          {
            "text": "电容器在电路中用于滤波、耦合和储能。"
          },
          {
            "text": "电容式触摸屏正是利用电容的变化来感知手指。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "平行板电容器电容 C 等于 ε₀εr S 除以 d。"
          },
          {
            "text": "板间电场 E 等于 U 除以 d，储能 W 等于二分之一 C U 平方。"
          },
          {
            "text": "电容器是储存电荷与电场能的基础元件。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "电介质",
        "description": "插入电介质如何增大电容"
      },
      {
        "title": "电容器的应用",
        "description": "滤波、储能与触摸屏"
      }
    ]
  },
  {
    "slug": "ampere-force",
    "title": "安培力",
    "subtitle": "通电导线在磁场中受到的力",
    "category": "电磁学",
    "difficulty": "intermediate",
    "targetAge": "15-18岁",
    "sourcePath": "/ampere-force",
    "sourceChunk": "AmpereForceExperiment-Bmiy-_Cw.js",
    "objectives": [
      "理解通电导线在磁场中受力",
      "掌握安培力公式 F = BIL sinθ",
      "运用左手定则判断力的方向"
    ],
    "prerequisites": [
      "磁场",
      "电流",
      "洛伦兹力"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到安培力实验！把一根通电导线放进磁场，它竟然会被推动。"
          },
          {
            "text": "这个看不见的力，正是电动机能够转动的根本原因。"
          },
          {
            "text": "今天我们就来探索通电导线在磁场中受力的规律。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "电流是大量电荷的定向移动，每个电荷在磁场中都受到洛伦兹力。"
          },
          {
            "text": "这些力的总和，就表现为整根导线受到的安培力。"
          },
          {
            "text": "安培力的方向，既垂直于电流，又垂直于磁场。"
          },
          {
            "text": "我们用左手定则来判断它的方向。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "安培力的大小由这个公式给出。",
            "formula": "F = BIL\\sin\\theta"
          },
          {
            "text": "其中 B 是磁感应强度，I 是电流，L 是导线长度，θ 是电流与磁场的夹角。"
          },
          {
            "text": "当电流与磁场垂直时，θ 为 90 度，受力最大。"
          },
          {
            "text": "当电流与磁场平行时，θ 为零，安培力为零。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调整电流大小，观察安培力如何成正比变化。"
          },
          {
            "text": "改变电流与磁场的夹角，看受力按正弦规律变化。"
          },
          {
            "text": "注意力的方向始终垂直于电流和磁场所在的平面。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "电动机利用安培力让线圈持续转动，把电能变成机械能。"
          },
          {
            "text": "扬声器靠安培力推动纸盆振动发声。"
          },
          {
            "text": "磁悬浮列车和电磁炮也都是安培力的大规模应用。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "通电导线在磁场中受到安培力，大小为 F 等于 BIL sinθ。"
          },
          {
            "text": "方向用左手定则判断，垂直于电流与磁场。"
          },
          {
            "text": "从电动机到扬声器，安培力驱动着现代世界。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "电动机原理",
        "description": "安培力如何驱动电机转动"
      },
      {
        "title": "磁悬浮",
        "description": "电磁力的工程应用"
      }
    ]
  },
  {
    "slug": "transformer",
    "title": "变压器与互感",
    "subtitle": "改变交流电压的电磁装置",
    "category": "电磁学",
    "difficulty": "intermediate",
    "targetAge": "16-18岁",
    "sourcePath": "/transformer",
    "sourceChunk": "TransformerExperiment-DK-6T3eA.js",
    "objectives": [
      "理解变压器的互感原理",
      "掌握原副线圈的电压电流关系",
      "认识理想变压器的功率守恒"
    ],
    "prerequisites": [
      "电磁感应",
      "交流电",
      "互感"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到变压器实验！发电厂的电要经过千里传输才到家里，靠的就是变压器。"
          },
          {
            "text": "它能把电压升高或降低，却几乎不损失能量。"
          },
          {
            "text": "今天我们就来揭示变压器背后的互感原理。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "变压器由原线圈、副线圈和共用的铁芯组成。"
          },
          {
            "text": "原线圈通入交流电，在铁芯中产生变化的磁通。"
          },
          {
            "text": "变化的磁通穿过副线圈，通过电磁感应在副线圈产生感应电压。"
          },
          {
            "text": "这种两个线圈通过磁场相互影响的现象，就是互感。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "原副线圈的电压之比等于它们的匝数之比。",
            "formula": "\\frac{U_1}{U_2} = \\frac{N_1}{N_2}"
          },
          {
            "text": "副线圈匝数多就升压，匝数少就降压。"
          },
          {
            "text": "理想变压器没有损耗，输入功率等于输出功率。",
            "formula": "U_1 I_1 = U_2 I_2"
          },
          {
            "text": "所以升压的同时电流减小，降压的同时电流增大。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调整副线圈匝数，观察输出电压如何按匝数比变化。"
          },
          {
            "text": "副线圈匝数多于原线圈时升压，少于时降压。"
          },
          {
            "text": "注意电压升高时电流相应减小，功率保持守恒。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "电网用升压变压器把电压升到几十万伏，减少远距离输电损耗。"
          },
          {
            "text": "到了用户端再用降压变压器降到安全的家用电压。"
          },
          {
            "text": "充电器、开关电源里的小变压器也无处不在。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "变压器靠互感工作，电压比等于匝数比。"
          },
          {
            "text": "理想变压器功率守恒，U1 I1 等于 U2 I2，升压则减流。"
          },
          {
            "text": "从电网输电到充电器，变压器支撑着现代电力系统。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "电网输电",
        "description": "高压输电为何能减少损耗"
      },
      {
        "title": "开关电源",
        "description": "高频变压器的小型化"
      }
    ]
  },
  {
    "slug": "wave-interference",
    "title": "波的干涉",
    "subtitle": "探索两列波的叠加现象",
    "category": "波动",
    "difficulty": "intermediate",
    "targetAge": "15-18岁",
    "sourcePath": "/wave-interference",
    "sourceChunk": "WaveInterferenceExperiment-CVdhv2hs.js",
    "objectives": [
      "理解波的叠加原理",
      "区分相长干涉和相消干涉",
      "观察干涉图样的形成"
    ],
    "prerequisites": [
      "波的基本概念",
      "波长和频率"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到波的干涉实验！今天我们要探索波的叠加现象。"
          },
          {
            "text": "当两列波相遇时，会发生干涉现象，产生美丽的干涉图样。"
          },
          {
            "text": "干涉现象是波动的重要特征，光的干涉证明了光是一种波。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "波的叠加原理：两列波相遇时，合振动等于各波单独引起的振动之和。"
          },
          {
            "text": "相长干涉：两波同相叠加，振幅增大。"
          },
          {
            "text": "相消干涉：两波反相叠加，振幅减小甚至为零。"
          },
          {
            "text": "产生稳定干涉的条件是两波源频率相同、相位差恒定。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "相长干涉条件：路程差等于波长的整数倍。",
            "formula": "\\Delta r = n\\lambda"
          },
          {
            "text": "相消干涉条件：路程差等于半波长的奇数倍。",
            "formula": "\\Delta r = (n+\\frac{1}{2})\\lambda"
          },
          {
            "text": "合振幅取决于两波的相位差。"
          }
        ]
      },
      {
        "id": "animation",
        "title": "动画演示",
        "lines": [
          {
            "text": "图中显示了两个波源产生的干涉图样。"
          },
          {
            "text": "亮线是相长干涉区域，暗线是相消干涉区域。"
          },
          {
            "text": "观察波纹的叠加，理解干涉图样的形成。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调整波长，观察干涉条纹间距的变化。"
          },
          {
            "text": "改变两波源的距离，观察干涉图样的变化。"
          },
          {
            "text": "调整相位差，观察干涉条纹的移动。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "光的干涉用于精密测量，如迈克尔逊干涉仪。"
          },
          {
            "text": "薄膜干涉产生肥皂泡的彩色条纹。"
          },
          {
            "text": "全息照相利用光的干涉记录三维图像。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "让我们总结一下今天学到的内容。"
          },
          {
            "text": "波的干涉是两列相干波叠加产生的现象。"
          },
          {
            "text": "相长干涉振幅增大，相消干涉振幅减小。"
          },
          {
            "text": "希望通过这个实验，你对波的干涉有了更深入的理解！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "杨氏双缝干涉",
        "description": "了解光的波动性的经典实验"
      },
      {
        "title": "薄膜干涉",
        "description": "探索日常生活中的干涉现象"
      }
    ]
  },
  {
    "slug": "standing-wave",
    "title": "驻波",
    "subtitle": "探索驻波的形成和特征",
    "category": "波动",
    "difficulty": "intermediate",
    "targetAge": "15-18岁",
    "sourcePath": "/standing-wave",
    "sourceChunk": "StandingWaveExperiment-CHyD-gUW.js",
    "objectives": [
      "理解驻波的形成原理",
      "掌握波节和波腹的概念",
      "观察不同谐波模式"
    ],
    "prerequisites": [
      "波的叠加原理",
      "波的反射"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到驻波实验！今天我们要探索一种特殊的波动现象。"
          },
          {
            "text": "驻波是两列相向传播的相干波叠加形成的，看起来像是静止不动的波。"
          },
          {
            "text": "吉他弦、管乐器的声音都与驻波有关。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "驻波由两列振幅、频率相同、传播方向相反的波叠加形成。"
          },
          {
            "text": "波节是振幅始终为零的点，波腹是振幅最大的点。"
          },
          {
            "text": "相邻波节或波腹之间的距离等于半个波长。"
          },
          {
            "text": "驻波不传播能量，能量在波节和波腹之间来回转换。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "两端固定的弦上驻波的波长满足 L 等于 n 乘以 λ 除以 2。",
            "formula": "L = n\\frac{\\lambda}{2}"
          },
          {
            "text": "其中 L 是弦长，n 是正整数，称为谐波次数。"
          },
          {
            "text": "基频（n=1）对应最低的振动频率。"
          },
          {
            "text": "弦的振动频率 f 等于 n 除以 2L 乘以根号下 T 除以 μ。"
          }
        ]
      },
      {
        "id": "animation",
        "title": "动画演示",
        "lines": [
          {
            "text": "图中显示了弦上的驻波，两端是固定的波节。"
          },
          {
            "text": "注意观察波节处始终静止，波腹处振动最剧烈。"
          },
          {
            "text": "整根弦同时达到最大位移，又同时回到平衡位置。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调整谐波次数，观察不同模式的驻波。"
          },
          {
            "text": "n=1 是基波，n=2 是二次谐波，以此类推。"
          },
          {
            "text": "改变弦的张力，观察振动频率的变化。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "弦乐器的发声原理就是弦的驻波振动。"
          },
          {
            "text": "管乐器利用空气柱的驻波产生声音。"
          },
          {
            "text": "微波炉中的驻波会造成加热不均匀。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "让我们总结一下今天学到的内容。"
          },
          {
            "text": "驻波由两列相向传播的相干波叠加形成。"
          },
          {
            "text": "波节振幅为零，波腹振幅最大，相邻间距为半波长。"
          },
          {
            "text": "希望通过这个实验，你对驻波有了更深入的理解！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "乐器的物理学",
        "description": "了解乐器发声的物理原理"
      },
      {
        "title": "共振现象",
        "description": "探索驻波与共振的关系"
      }
    ]
  },
  {
    "slug": "doppler-effect",
    "title": "多普勒效应",
    "subtitle": "探索声源运动时的频率变化",
    "category": "波动",
    "difficulty": "intermediate",
    "targetAge": "15-18岁",
    "sourcePath": "/doppler-effect",
    "sourceChunk": "DopplerEffectExperiment-CysdnFTL.js",
    "objectives": [
      "理解多普勒效应的原理",
      "掌握频率变化的计算",
      "观察声源运动对频率的影响"
    ],
    "prerequisites": [
      "波的基本概念",
      "声波"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到多普勒效应实验！今天我们要探索一个有趣的波动现象。"
          },
          {
            "text": "当救护车驶过时，你是否注意到警笛声音的变化？"
          },
          {
            "text": "这就是多普勒效应，由奥地利物理学家多普勒在 1842 年发现。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "多普勒效应是指波源与观察者相对运动时，观察到的频率发生变化的现象。"
          },
          {
            "text": "当波源靠近观察者时，观察到的频率升高，声音变尖。"
          },
          {
            "text": "当波源远离观察者时，观察到的频率降低，声音变低沉。"
          },
          {
            "text": "多普勒效应适用于所有类型的波，包括声波和电磁波。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "观察到的频率 f 撇等于 f 乘以 (v 加减 v观) 除以 (v 减加 v源)。",
            "formula": "f' = f\\frac{v \\pm v_o}{v \\mp v_s}"
          },
          {
            "text": "其中 v 是波速，v观 是观察者速度，v源 是波源速度。"
          },
          {
            "text": "靠近时频率升高，远离时频率降低。"
          },
          {
            "text": "当波源速度超过波速时，会产生激波（如音爆）。"
          }
        ]
      },
      {
        "id": "animation",
        "title": "动画演示",
        "lines": [
          {
            "text": "图中显示了运动声源产生的波前分布。"
          },
          {
            "text": "注意观察，声源前方的波前被压缩，后方的波前被拉伸。"
          },
          {
            "text": "波前越密集，频率越高；波前越稀疏，频率越低。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调整声源速度，观察波前分布的变化。"
          },
          {
            "text": "当速度接近声速时，波前会堆积在一起。"
          },
          {
            "text": "改变观察者位置，听听不同位置的频率变化。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "多普勒雷达用于测量车辆速度和天气预报。"
          },
          {
            "text": "医学超声利用多普勒效应检测血流速度。"
          },
          {
            "text": "天文学家通过红移测量星系远离我们的速度。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "让我们总结一下今天学到的内容。"
          },
          {
            "text": "多普勒效应是波源与观察者相对运动引起的频率变化。"
          },
          {
            "text": "靠近时频率升高，远离时频率降低。"
          },
          {
            "text": "希望通过这个实验，你对多普勒效应有了更深入的理解！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "宇宙红移",
        "description": "了解多普勒效应在天文学中的应用"
      },
      {
        "title": "音爆与激波",
        "description": "探索超音速飞行的物理现象"
      }
    ]
  },
  {
    "slug": "coupled-lattice",
    "title": "耦合振动与晶格波",
    "subtitle": "从单个振子到机械波的传播",
    "category": "波动",
    "difficulty": "advanced",
    "targetAge": "大学本科",
    "sourcePath": "/coupled-lattice",
    "sourceChunk": "CoupledLatticeExperiment-BqzXbA7B.js",
    "objectives": [
      "理解耦合振子链的运动",
      "区分横波与纵波",
      "认识机械波的传播与波速"
    ],
    "prerequisites": [
      "简谐振动",
      "弹簧振子"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到耦合振动实验！我们把许多小球用弹簧连成一条链。"
          },
          {
            "text": "绿色的是驱动端，灰色的是固定端，中间的蓝色小球可以自由振动。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "从振子到波",
        "lines": [
          {
            "text": "每个小球只和它的近邻通过弹簧相互作用。"
          },
          {
            "text": "当左端被驱动振动，扰动会一格一格地向右传递，这就是波。"
          },
          {
            "text": "波动传播的是能量和振动状态，而不是物质本身。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "每个质点的运动方程由两侧弹簧的合力决定。",
            "formula": "m\\ddot{u}_i = k(u_{i+1}-2u_i+u_{i-1})"
          },
          {
            "text": "波速由耦合刚度和格距决定。",
            "formula": "c = a\\sqrt{k/m}"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "动手探索",
        "lines": [
          {
            "text": "切换横波，小球在垂直方向上下振动，波形清晰可见。"
          },
          {
            "text": "切换纵波，小球沿链方向疏密变化，形成疏部和密部。"
          },
          {
            "text": "增大耦合刚度，波传播得更快；增大阻尼，波很快衰减。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "固体中的声波和热振动，本质上就是晶格中原子的耦合振动。"
          },
          {
            "text": "这种模型是固体物理中声子概念的基础。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "大量耦合振子的集体运动，呈现为沿链传播的机械波。"
          },
          {
            "text": "横波位移垂直传播方向，纵波位移沿传播方向。"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "声子",
        "description": "晶格振动的量子化"
      },
      {
        "title": "色散关系",
        "description": "频率与波数的关系"
      }
    ]
  },
  {
    "slug": "beat-frequency",
    "title": "拍频现象",
    "subtitle": "两个相近频率叠加产生的强弱起伏",
    "category": "波动",
    "difficulty": "intermediate",
    "targetAge": "15-18岁",
    "sourcePath": "/beat-frequency",
    "sourceChunk": "BeatFrequencyExperiment-CmkFiv4R.js",
    "objectives": [
      "理解拍频现象的产生机制",
      "掌握拍频公式 f_beat = |f1 - f2|",
      "认识拍频在调音中的应用"
    ],
    "prerequisites": [
      "简谐波",
      "波的叠加原理"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到拍频实验！你有没有听过两个音调相近的声音叠在一起，发出忽强忽弱的嗡嗡声？"
          },
          {
            "text": "这种周期性的强弱起伏，就是拍现象，它的频率叫做拍频。"
          },
          {
            "text": "调音师正是靠它来精确校准乐器，今天我们就来揭示它的原理。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "当两列频率相近的波叠加时，它们时而同相、时而反相。"
          },
          {
            "text": "同相时波峰叠加波峰，振幅增大，声音变响。"
          },
          {
            "text": "反相时波峰遇到波谷，相互抵消，声音变弱甚至消失。"
          },
          {
            "text": "这种强弱交替的周期性变化，就形成了我们听到的拍。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "两个频率叠加，可以写成一个快速振荡乘以一个缓慢变化的包络。",
            "formula": "y = 2\\cos(2\\pi \\tfrac{f_1-f_2}{2}t)\\sin(2\\pi \\tfrac{f_1+f_2}{2}t)"
          },
          {
            "text": "快速振荡的频率是两频率的平均值，决定了听到的音调。"
          },
          {
            "text": "缓慢变化的包络决定了响度的起伏，它的频率正比于频率差。"
          },
          {
            "text": "每秒钟响度起伏的次数，也就是拍频，等于两个频率之差的绝对值。",
            "formula": "f_{beat} = |f_1 - f_2|"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调整两个频率，让它们越来越接近，观察包络的起伏变得越来越慢。"
          },
          {
            "text": "当两频率完全相等时，拍频为零，包络不再起伏。"
          },
          {
            "text": "拉大频率差，拍频增大，强弱交替变得急促。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "调音师把标准音叉和琴弦一起发声，通过听拍频是否消失来判断音准。"
          },
          {
            "text": "拍频越慢，说明两个频率越接近，音调调得越准。"
          },
          {
            "text": "在无线电技术中，频率混合产生的差频是超外差接收机的核心原理。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "两个相近频率叠加，产生振幅周期性起伏的拍现象。"
          },
          {
            "text": "拍频等于两个频率之差的绝对值，f_beat 等于 f1 减 f2 的绝对值。"
          },
          {
            "text": "从乐器调音到无线电，拍频无处不在。希望你已经听懂了它的节拍！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "乐器调音",
        "description": "调音师如何用拍频校准音准"
      },
      {
        "title": "差频与外差",
        "description": "无线电接收机中的频率混合"
      }
    ]
  },
  {
    "slug": "lissajous",
    "title": "李萨如图形",
    "subtitle": "两个垂直振动合成的奇妙轨迹",
    "category": "波动",
    "difficulty": "advanced",
    "targetAge": "16-18岁",
    "sourcePath": "/lissajous",
    "sourceChunk": "LissajousExperiment-ChcD6B0a.js",
    "objectives": [
      "理解两垂直简谐振动的合成",
      "掌握频率比与相位差对图形的影响",
      "认识李萨如图形在频率测量中的应用"
    ],
    "prerequisites": [
      "简谐振动",
      "振动的合成",
      "相位概念"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到李萨如图形实验！如果让一个点同时在水平和竖直方向做简谐振动，会画出什么轨迹？"
          },
          {
            "text": "答案是各种优美的曲线：直线、椭圆、8 字形，甚至复杂的花纹。"
          },
          {
            "text": "这些图形以法国物理学家李萨如命名，今天我们就来探索它们的规律。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "李萨如图形是两个相互垂直的简谐振动合成的结果。"
          },
          {
            "text": "水平方向和竖直方向各自做简谐振动，它们的频率和相位可以不同。"
          },
          {
            "text": "图形的形状主要由两个振动的频率比决定。"
          },
          {
            "text": "当频率比是简单整数比时，图形闭合而稳定；否则图形会不断变化。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "水平和竖直方向的振动分别用如下方程描述。",
            "formula": "x = A\\sin(a\\omega t + \\delta),\\quad y = B\\sin(b\\omega t)"
          },
          {
            "text": "其中 a 比 b 就是两方向的频率比，δ 是它们的相位差。"
          },
          {
            "text": "当频率比为 1 比 1 时，相位差为零是一条直线，相位差 90 度则是椭圆或圆。"
          },
          {
            "text": "频率比越复杂，图形的环和交点就越多。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调整频率比，观察图形从椭圆变成 8 字形、再变成更复杂的花样。"
          },
          {
            "text": "改变相位差，看 1 比 1 时图形如何在直线、椭圆和圆之间连续变换。"
          },
          {
            "text": "数一数图形与水平、竖直边界的切点数，它们的比正好等于频率比。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "在示波器上，把两个信号分别接到水平和竖直输入，就能得到李萨如图形。"
          },
          {
            "text": "工程师据此比较两个信号的频率比和相位差，是经典的频率测量方法。"
          },
          {
            "text": "李萨如图形也常用于艺术与可视化，展现数学的对称之美。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "李萨如图形是两个垂直简谐振动的合成轨迹。"
          },
          {
            "text": "频率比决定图形的基本形态，相位差决定它的具体形状。"
          },
          {
            "text": "从示波器测量到数学之美，李萨如图形连接了科学与艺术。希望你已经领略它的奇妙！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "示波器与频率测量",
        "description": "用李萨如图形比较两信号频率"
      },
      {
        "title": "相位差的判定",
        "description": "从图形形状读出相位关系"
      }
    ]
  },
  {
    "slug": "air-column",
    "title": "空气柱共振",
    "subtitle": "管中驻波与乐器的发声原理",
    "category": "波动",
    "difficulty": "intermediate",
    "targetAge": "15-18岁",
    "sourcePath": "/air-column",
    "sourceChunk": "AirColumnExperiment-C5mhG0w4.js",
    "objectives": [
      "理解空气柱中的驻波共振",
      "区分闭管与开管的共振频率",
      "认识谐波与乐器音色"
    ],
    "prerequisites": [
      "驻波",
      "声波",
      "频率与波长"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到空气柱共振实验！吹一吹瓶口，会发出嗡嗡的声音，这就是空气柱在共鸣。"
          },
          {
            "text": "长笛、箫、管风琴，所有管乐器都靠管中空气柱的振动来发声。"
          },
          {
            "text": "今天我们就来探索空气柱共振的规律，看看管长如何决定音高。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "当声波在管中来回反射并叠加，特定频率下会形成稳定的驻波。"
          },
          {
            "text": "管口开放处空气自由振动，是位移的波腹；封闭端不能振动，是波节。"
          },
          {
            "text": "闭管一端封闭一端开口，开管两端都开口，它们的共振规律不同。"
          },
          {
            "text": "只有满足边界条件的特定波长才能共振，对应一系列谐波频率。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "闭管的共振频率只含奇数倍基频。",
            "formula": "f_n = \\frac{n v}{4L}, \\quad n = 1,3,5,\\dots"
          },
          {
            "text": "开管的共振频率包含所有整数倍基频。",
            "formula": "f_n = \\frac{n v}{2L}, \\quad n = 1,2,3,\\dots"
          },
          {
            "text": "其中 v 是声速，L 是管长。管越长，基频越低，音越低沉。"
          },
          {
            "text": "同样长度下，开管的基频是闭管的两倍。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "切换闭管与开管，观察管中驻波的形状和波节波腹位置。"
          },
          {
            "text": "改变谐波次数，看更高次谐波如何在管中形成更多波节。"
          },
          {
            "text": "调整管长，听一听基频如何随之变化。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "管风琴用不同长度的管子奏出不同音高，长管低音、短管高音。"
          },
          {
            "text": "闭管只有奇次谐波，使单簧管的音色独具特色。"
          },
          {
            "text": "共鸣管实验也是测量声速的经典方法。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "空气柱在特定频率下形成驻波共振，封闭端为波节、开口端为波腹。"
          },
          {
            "text": "闭管只有奇次谐波 f=nv/4L，开管含全部谐波 f=nv/2L。"
          },
          {
            "text": "管长决定音高，谐波结构决定音色。这就是管乐器的奥秘。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "管乐器的原理",
        "description": "长笛、单簧管的发声差异"
      },
      {
        "title": "共鸣箱",
        "description": "为什么乐器需要共鸣腔"
      }
    ]
  },
  {
    "slug": "mach-cone",
    "title": "马赫锥与冲击波",
    "subtitle": "超音速运动激起的声爆",
    "category": "波动",
    "difficulty": "intermediate",
    "targetAge": "16-18岁",
    "sourcePath": "/mach-cone",
    "sourceChunk": "MachConeExperiment-BG7xIT7C.js",
    "objectives": [
      "理解波源运动对波前的影响",
      "认识马赫锥的形成",
      "掌握马赫角与马赫数的关系"
    ],
    "prerequisites": [
      "波的传播",
      "多普勒效应",
      "声速"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到马赫锥实验！超音速战斗机飞过时，地面会听到一声巨响，这就是音爆。"
          },
          {
            "text": "当波源运动得比波还快，会发生什么奇妙的现象？"
          },
          {
            "text": "今天我们就来看看，超音速运动如何激起冲击波，形成著名的马赫锥。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "波源每经过一点都会发出一个球面波，以声速向外扩展。"
          },
          {
            "text": "当波源速度小于声速，波前虽被压缩，但仍能领先于波源，这是多普勒效应。"
          },
          {
            "text": "当波源速度超过声速，波源跑在了波前面，所有波前叠加成一个锥面。"
          },
          {
            "text": "这个锥面就是马赫锥，锥面处波叠加最强，形成冲击波。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "马赫数是波源速度与声速之比。",
            "formula": "M = \\frac{v_{source}}{v_{sound}}"
          },
          {
            "text": "马赫锥半顶角由马赫数决定。",
            "formula": "\\sin\\theta = \\frac{1}{M}"
          },
          {
            "text": "马赫数越大，锥角越尖锐；马赫数等于 1 时，锥退化为平面波前。"
          },
          {
            "text": "只有当马赫数大于 1，也就是超音速时，才会形成马赫锥。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调整波源速度，观察波前的变化。"
          },
          {
            "text": "速度低于声速时，波前在前方堆积但不相交。"
          },
          {
            "text": "速度超过声速时，波前包络出现清晰的马赫锥，速度越大锥越尖。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "超音速飞机和子弹都会拖出马赫锥，产生音爆。"
          },
          {
            "text": "马赫数是航空航天领域描述飞行速度的重要参数。"
          },
          {
            "text": "光学中带电粒子超过介质光速时，会产生类似的切伦科夫辐射。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "波源超音速运动时，波前叠加形成马赫锥与冲击波。"
          },
          {
            "text": "马赫角满足 sinθ 等于 1 除以马赫数 M。"
          },
          {
            "text": "马赫数越大锥越尖锐。这就是音爆背后的物理。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "音爆",
        "description": "超音速飞机产生的巨响"
      },
      {
        "title": "切伦科夫辐射",
        "description": "光学中的类似现象"
      }
    ]
  },
  {
    "slug": "group-velocity",
    "title": "群速度与相速度",
    "subtitle": "波包与波纹的不同步行进",
    "category": "波动",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/group-velocity",
    "sourceChunk": "GroupVelocityExperiment-C43iAcSd.js",
    "objectives": [
      "区分相速度与群速度",
      "理解波包由多个频率分量叠加",
      "认识色散介质中的速度差异"
    ],
    "prerequisites": [
      "波的叠加",
      "拍频",
      "波速"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到群速度与相速度实验！往水里扔一块石头，水波向外扩散。"
          },
          {
            "text": "仔细看，单个波纹的移动速度，和整个波包的移动速度可能并不相同。"
          },
          {
            "text": "这就引出了两个重要概念：相速度和群速度。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "相速度是单个波纹、也就是某个固定相位点的移动速度。"
          },
          {
            "text": "群速度是整个波包、也就是振幅包络的移动速度。"
          },
          {
            "text": "波包是由许多频率相近的波叠加而成的，类似拍现象。"
          },
          {
            "text": "在无色散介质中两者相等；在色散介质中，它们会出现差异。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "相速度等于角频率除以波数。",
            "formula": "v_p = \\frac{\\omega}{k}"
          },
          {
            "text": "群速度等于角频率对波数的导数。",
            "formula": "v_g = \\frac{d\\omega}{dk}"
          },
          {
            "text": "当频率与波数成正比时，两者相等，介质无色散。"
          },
          {
            "text": "当色散存在时，群速度通常代表能量和信息的传播速度。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "观察波包：红点标记一个波纹（相速度），绿框标记包络（群速度）。"
          },
          {
            "text": "调整色散程度，看两个速度如何分离。"
          },
          {
            "text": "在强色散下，波纹甚至可能比包络跑得快，从包络中穿过。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "光纤通信中，色散会让信号脉冲展宽，限制传输速率。"
          },
          {
            "text": "群速度决定了信号和能量真正的传播速度。"
          },
          {
            "text": "理解色散，是设计光学和通信系统的关键。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "相速度是单个波纹的速度，群速度是波包包络的速度。"
          },
          {
            "text": "相速度 vp 等于 ω/k，群速度 vg 等于 dω/dk。"
          },
          {
            "text": "色散介质中两者不同，群速度代表信息传播。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "色散与彩虹",
        "description": "不同频率传播速度的差异"
      },
      {
        "title": "信息传播速度",
        "description": "群速度与信号速度"
      }
    ]
  },
  {
    "slug": "huygens-principle",
    "title": "惠更斯原理",
    "subtitle": "每个波前点都是新的子波源",
    "category": "波动",
    "difficulty": "intermediate",
    "targetAge": "16-17岁",
    "sourcePath": "/huygens-principle",
    "sourceChunk": "HuygensPrincipleExperiment-KQM-1Cng.js",
    "objectives": [
      "理解波前与子波的概念",
      "用惠更斯原理解释折射与衍射",
      "认识波动传播的几何方法"
    ],
    "prerequisites": [
      "波前",
      "波速",
      "波的传播"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到惠更斯原理！它用一个巧妙的想法解释波如何前进。"
          },
          {
            "text": "波前上的每一点，都可以看作一个发出小球面波的新波源。"
          },
          {
            "text": "这些子波的包络面，就是下一时刻的波前。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "波前是波动中相位相同的点连成的面。"
          },
          {
            "text": "惠更斯设想，波前上每个点都向前发出微小的子波。"
          },
          {
            "text": "经过一小段时间，所有子波扩展成小圆。"
          },
          {
            "text": "这些小圆的公切线，就构成新的波前。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "子波在时间 Δt 内传播的半径等于波速乘时间。",
            "formula": "r = v\\,\\Delta t"
          },
          {
            "text": "平面波的子波包络仍是平面，波继续直行。"
          },
          {
            "text": "进入不同介质波速改变，包络偏转，这就是折射。",
            "formula": "\\dfrac{\\sin\\theta_1}{\\sin\\theta_2}=\\dfrac{v_1}{v_2}"
          },
          {
            "text": "遇到障碍边缘，子波向阴影区扩散，形成衍射。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "观察波前上的子波源如何发出圆形子波。"
          },
          {
            "text": "调节子波数量与波速，看包络如何形成新波前。"
          },
          {
            "text": "切换平面波与球面波，体会包络的不同形状。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "惠更斯原理可以简洁地推导出折射定律。"
          },
          {
            "text": "它解释了光和声波绕过障碍的衍射现象。"
          },
          {
            "text": "相控阵雷达正是利用子波叠加来控制波束方向。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "惠更斯原理把每个波前点视为新的子波源。"
          },
          {
            "text": "子波的包络面构成下一时刻的波前。"
          },
          {
            "text": "它统一解释了直行、折射与衍射。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "折射定律的推导",
        "description": "惠更斯原理解释斯涅尔定律"
      },
      {
        "title": "衍射现象",
        "description": "波绕过障碍物"
      }
    ]
  },
  {
    "slug": "refraction",
    "title": "光的折射",
    "subtitle": "探索光在不同介质中的传播",
    "category": "光学",
    "difficulty": "intermediate",
    "targetAge": "15-18岁",
    "sourcePath": "/refraction",
    "sourceChunk": "RefractionExperiment-QmZfVcEx.js",
    "objectives": [
      "理解光的折射现象",
      "掌握斯涅尔定律",
      "观察全反射现象"
    ],
    "prerequisites": [
      "光的直线传播",
      "光速"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到光的折射实验！今天我们要探索光在不同介质中的传播规律。"
          },
          {
            "text": "你是否注意过，把筷子插入水中，筷子看起来像是弯折了？"
          },
          {
            "text": "这就是光的折射现象，是光学中最基本的规律之一。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "光从一种介质进入另一种介质时，传播方向会发生改变，这就是折射。"
          },
          {
            "text": "折射率 n 等于光在真空中的速度除以光在介质中的速度。"
          },
          {
            "text": "光从光疏介质进入光密介质时，折射角小于入射角。"
          },
          {
            "text": "光从光密介质进入光疏介质时，折射角大于入射角。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "斯涅尔定律：n1 乘以 sin θ1 等于 n2 乘以 sin θ2。",
            "formula": "n_1\\sin\\theta_1 = n_2\\sin\\theta_2"
          },
          {
            "text": "其中 n1 和 n2 是两种介质的折射率，θ1 是入射角，θ2 是折射角。"
          },
          {
            "text": "临界角 θc 满足 sin θc 等于 n2 除以 n1。",
            "formula": "\\sin\\theta_c = \\frac{n_2}{n_1}"
          },
          {
            "text": "当入射角大于临界角时，发生全反射。"
          }
        ]
      },
      {
        "id": "animation",
        "title": "动画演示",
        "lines": [
          {
            "text": "图中显示了光线从空气进入玻璃的折射过程。"
          },
          {
            "text": "注意观察入射光线、反射光线和折射光线的关系。"
          },
          {
            "text": "当入射角增大到临界角时，折射光线消失，发生全反射。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调整入射角，观察折射角的变化。"
          },
          {
            "text": "改变介质的折射率，观察光线偏折程度的变化。"
          },
          {
            "text": "尝试找到临界角，观察全反射现象。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "光纤通信利用全反射原理传输光信号。"
          },
          {
            "text": "眼镜和相机镜头利用折射原理聚焦光线。"
          },
          {
            "text": "海市蜃楼是大气折射产生的自然奇观。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "让我们总结一下今天学到的内容。"
          },
          {
            "text": "光的折射遵循斯涅尔定律，折射率决定光线偏折程度。"
          },
          {
            "text": "当入射角大于临界角时，发生全反射。"
          },
          {
            "text": "希望通过这个实验，你对光的折射有了更深入的理解！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "光纤通信",
        "description": "了解全反射在通信中的应用"
      },
      {
        "title": "色散现象",
        "description": "探索不同波长光的折射差异"
      }
    ]
  },
  {
    "slug": "lens",
    "title": "透镜成像",
    "subtitle": "探索凸透镜和凹透镜的成像规律",
    "category": "光学",
    "difficulty": "intermediate",
    "targetAge": "15-18岁",
    "sourcePath": "/lens",
    "sourceChunk": "LensExperiment-BO1bUrcW.js",
    "objectives": [
      "理解透镜成像原理",
      "掌握透镜成像公式",
      "区分实像和虚像"
    ],
    "prerequisites": [
      "光的折射",
      "光路图"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到透镜成像实验！今天我们要探索透镜的神奇世界。"
          },
          {
            "text": "从放大镜到照相机，从眼镜到望远镜，透镜无处不在。"
          },
          {
            "text": "让我们一起来了解透镜是如何成像的。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "凸透镜中间厚、边缘薄，对光线有会聚作用。"
          },
          {
            "text": "凹透镜中间薄、边缘厚，对光线有发散作用。"
          },
          {
            "text": "焦点是平行光经透镜后会聚或发散的中心点。"
          },
          {
            "text": "实像可以用光屏接收，虚像只能用眼睛观察。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "透镜成像公式：1 除以 f 等于 1 除以 u 加 1 除以 v。",
            "formula": "\\frac{1}{f} = \\frac{1}{u} + \\frac{1}{v}"
          },
          {
            "text": "其中 f 是焦距，u 是物距，v 是像距。"
          },
          {
            "text": "放大率 m 等于像高除以物高，也等于像距除以物距。",
            "formula": "m = \\frac{h'}{h} = \\frac{v}{u}"
          },
          {
            "text": "凸透镜焦距为正，凹透镜焦距为负。"
          }
        ]
      },
      {
        "id": "animation",
        "title": "动画演示",
        "lines": [
          {
            "text": "图中显示了凸透镜的成像过程。"
          },
          {
            "text": "三条特殊光线：过光心不偏折，平行主轴过焦点，过焦点平行主轴。"
          },
          {
            "text": "物体在不同位置时，成像的大小、正倒、虚实都不同。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "移动物体位置，观察像的变化。"
          },
          {
            "text": "当物距大于二倍焦距时，成缩小的倒立实像。"
          },
          {
            "text": "当物距小于焦距时，成放大的正立虚像，这就是放大镜的原理。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "照相机利用凸透镜成缩小的倒立实像。"
          },
          {
            "text": "投影仪利用凸透镜成放大的倒立实像。"
          },
          {
            "text": "近视眼镜用凹透镜，远视眼镜用凸透镜。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "让我们总结一下今天学到的内容。"
          },
          {
            "text": "凸透镜会聚光线，凹透镜发散光线。"
          },
          {
            "text": "透镜成像遵循成像公式，物距决定像的性质。"
          },
          {
            "text": "希望通过这个实验，你对透镜成像有了更深入的理解！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "光学仪器",
        "description": "了解显微镜和望远镜的原理"
      },
      {
        "title": "人眼的光学",
        "description": "探索眼睛的成像机制"
      }
    ]
  },
  {
    "slug": "total-reflection",
    "title": "全反射与临界角",
    "subtitle": "探索光从光密介质射向光疏介质的奇妙现象",
    "category": "光学",
    "difficulty": "intermediate",
    "targetAge": "15-18岁",
    "sourcePath": "/total-reflection",
    "sourceChunk": "TotalReflectionExperiment-DxEN6bxz.js",
    "objectives": [
      "理解全反射发生的条件",
      "掌握临界角公式 sinθc = n2/n1",
      "认识全反射在光纤等技术中的应用"
    ],
    "prerequisites": [
      "光的折射",
      "斯涅尔定律",
      "折射率概念"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到全反射实验！你有没有想过，光为什么能在细细的光纤里传播几千公里而不漏出来？"
          },
          {
            "text": "答案就是全反射，一种让光被完全反射回介质内部的奇妙现象。"
          },
          {
            "text": "今天我们就来探索它发生的条件，以及关键的临界角。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "当光从光密介质射向光疏介质时，比如从玻璃射向空气，折射角会大于入射角。"
          },
          {
            "text": "随着入射角增大，折射角也增大，折射光线越来越贴近界面。"
          },
          {
            "text": "当折射角达到 90 度时，对应的入射角就叫做临界角。"
          },
          {
            "text": "一旦入射角超过临界角，光线就不再折射，而是全部被反射回原介质，这就是全反射。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "由斯涅尔定律 n1 sinθ1 等于 n2 sinθ2，当折射角为 90 度时推出临界角公式。",
            "formula": "n_1 \\sin\\theta_1 = n_2 \\sin\\theta_2"
          },
          {
            "text": "临界角的正弦等于两介质折射率之比，n2 除以 n1。",
            "formula": "\\sin\\theta_c = \\frac{n_2}{n_1}"
          },
          {
            "text": "注意全反射只能发生在从光密介质到光疏介质的方向，也就是 n1 大于 n2 时。"
          },
          {
            "text": "折射率差越大，临界角越小，越容易发生全反射。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "试着慢慢增大入射角，观察折射光线如何越来越靠近界面。"
          },
          {
            "text": "当入射角超过临界角的瞬间，折射光线消失，只剩下反射光线，全反射发生了。"
          },
          {
            "text": "调整介质的折射率，看看临界角如何随之改变。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "光纤通信是全反射最重要的应用，光信号在纤芯中不断全反射，几乎无损耗地传播。"
          },
          {
            "text": "医用内窥镜也利用光纤，把体内的图像传到体外。"
          },
          {
            "text": "钻石之所以璀璨，正是因为高折射率带来的小临界角，让光在内部反复全反射。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "全反射发生的条件是：光从光密介质射向光疏介质，且入射角大于临界角。"
          },
          {
            "text": "临界角公式是 sinθc 等于 n2 除以 n1。"
          },
          {
            "text": "从光纤到钻石，全反射改变了我们的通信和生活。希望你已经掌握了它！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "光纤通信",
        "description": "全反射如何让光在光纤中传播千里"
      },
      {
        "title": "海市蜃楼",
        "description": "大气折射与全反射形成的奇观"
      }
    ]
  },
  {
    "slug": "double-slit",
    "title": "杨氏双缝干涉",
    "subtitle": "揭示光的波动本质与干涉条纹",
    "category": "光学",
    "difficulty": "intermediate",
    "targetAge": "15-18岁",
    "sourcePath": "/double-slit",
    "sourceChunk": "DoubleSlitExperiment-B14SSGdz.js",
    "objectives": [
      "理解光的干涉现象与波动本质",
      "掌握条纹间距公式 Δy = λL/d",
      "认识波长、缝间距对条纹的影响"
    ],
    "prerequisites": [
      "波的叠加原理",
      "光的波长概念"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到双缝干涉实验！1801 年，托马斯·杨用一个简单的实验，证明了光是一种波。"
          },
          {
            "text": "让一束光通过两条紧挨的狭缝，屏幕上竟出现了明暗相间的条纹。"
          },
          {
            "text": "这些条纹无法用光的微粒说解释，却是波动说最有力的证据。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "光通过两条狭缝后，形成两束相干光波，它们在空间中相互叠加。"
          },
          {
            "text": "在某些位置，两列波峰峰相遇，相互加强，形成明亮的亮纹。"
          },
          {
            "text": "在另一些位置，波峰与波谷相遇，相互抵消，形成黑暗的暗纹。"
          },
          {
            "text": "这种波叠加产生的强弱分布，就是干涉现象。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "当两束光的光程差等于波长的整数倍时，出现亮纹。",
            "formula": "d\\sin\\theta = k\\lambda"
          },
          {
            "text": "相邻亮纹之间的间距，等于波长乘以屏距，再除以缝间距。",
            "formula": "\\Delta y = \\frac{\\lambda L}{d}"
          },
          {
            "text": "其中 λ 是波长，L 是缝到屏的距离，d 是两缝间距。"
          },
          {
            "text": "波长越长或缝间距越小，条纹就越宽，越容易观察。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "试着调整波长，从红光到紫光，观察条纹间距和颜色如何变化。"
          },
          {
            "text": "减小缝间距 d，你会看到条纹明显变宽。"
          },
          {
            "text": "增大屏距 L，条纹也会随之展开，这正符合公式的预言。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "干涉是精密测量的利器，干涉仪能测出小于一个波长的微小位移。"
          },
          {
            "text": "引力波探测器 LIGO 就用激光干涉，捕捉到了时空的涟漪。"
          },
          {
            "text": "双缝实验后来还用单个光子重做，开启了量子力学的深邃世界。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "双缝干涉证明了光的波动性，屏上出现明暗相间的条纹。"
          },
          {
            "text": "条纹间距公式 Δy 等于 λL 除以 d。"
          },
          {
            "text": "从托马斯·杨到量子力学，这个实验改变了我们对光和世界的认识。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "光的波粒二象性",
        "description": "单光子双缝实验揭示量子奥秘"
      },
      {
        "title": "薄膜干涉",
        "description": "肥皂泡与油膜的彩色条纹"
      }
    ]
  },
  {
    "slug": "diffraction-grating",
    "title": "衍射光栅",
    "subtitle": "用密集的狭缝把光分解成绚丽光谱",
    "category": "光学",
    "difficulty": "advanced",
    "targetAge": "16-18岁",
    "sourcePath": "/diffraction-grating",
    "sourceChunk": "DiffractionGratingExperiment-BpMg1fT9.js",
    "objectives": [
      "理解光栅衍射的多缝干涉原理",
      "掌握光栅方程 d sinθ = kλ",
      "认识光栅在光谱分析中的应用"
    ],
    "prerequisites": [
      "双缝干涉",
      "光的波长",
      "三角函数"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到衍射光栅实验！你见过 CD 光盘在阳光下闪现彩虹吗？那就是光栅的杰作。"
          },
          {
            "text": "光栅是刻有成千上万条平行狭缝的精密元件，能把光分解成清晰的光谱。"
          },
          {
            "text": "它比双缝更锐利、更明亮，是现代光谱分析的核心工具。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "光栅可以看作大量等间距的狭缝，相邻狭缝的间距叫做光栅常数 d。"
          },
          {
            "text": "光通过每条狭缝后发生衍射，所有狭缝的光再相互干涉。"
          },
          {
            "text": "只有在特定角度上，所有狭缝的光才完全同相叠加，形成明亮的主极大。"
          },
          {
            "text": "狭缝越多，主极大就越细越亮，分辨本领越强。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "光栅方程指出，相邻狭缝的光程差等于波长整数倍时出现主极大。",
            "formula": "d\\sin\\theta = k\\lambda"
          },
          {
            "text": "其中 d 是光栅常数，θ 是衍射角，k 是级次，取 0、1、2 等整数。"
          },
          {
            "text": "k 等于零是中央明纹，两侧依次是一级、二级等谱线。"
          },
          {
            "text": "波长越长，同一级的衍射角越大，所以红光偏折得比紫光更多。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "增加每毫米的刻线数，光栅常数减小，各级谱线分得更开。"
          },
          {
            "text": "改变波长，观察各级主极大的位置和颜色如何变化。"
          },
          {
            "text": "注意当衍射角超过 90 度时，对应的高级次谱线就消失了。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "天文学家用光栅光谱仪分析星光，判断恒星的成分和运动。"
          },
          {
            "text": "化学分析中，光谱可以鉴定物质的种类和浓度。"
          },
          {
            "text": "CD、DVD 表面的微细沟槽就是天然的反射光栅，所以会闪现彩虹。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "光栅由大量等间距狭缝组成，通过多缝干涉产生锐利的主极大。"
          },
          {
            "text": "光栅方程是 d sinθ 等于 k λ，决定各级谱线的位置。"
          },
          {
            "text": "从星光分析到光盘彩虹，光栅让我们看清了光的成分。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "光谱仪",
        "description": "光栅如何分析星光的成分"
      },
      {
        "title": "CD 光盘的彩虹",
        "description": "光盘表面的衍射光栅效应"
      }
    ]
  },
  {
    "slug": "thin-film",
    "title": "薄膜干涉",
    "subtitle": "肥皂泡与油膜上的绚丽色彩从何而来",
    "category": "光学",
    "difficulty": "advanced",
    "targetAge": "16-18岁",
    "sourcePath": "/thin-film",
    "sourceChunk": "ThinFilmExperiment-uBrkW6Py.js",
    "objectives": [
      "理解薄膜上下表面反射光的干涉",
      "掌握光程差 2nd 与半波损失",
      "解释肥皂泡和油膜的彩色条纹"
    ],
    "prerequisites": [
      "光的干涉",
      "折射率",
      "光程概念"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到薄膜干涉实验！你一定见过肥皂泡和水面油膜上流动的彩虹色。"
          },
          {
            "text": "这些色彩并非来自颜料，而是光在薄膜上发生干涉的结果。"
          },
          {
            "text": "今天我们就来揭开这层薄薄的膜里隐藏的光学奥秘。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "当光照到薄膜上，一部分在上表面反射，一部分进入薄膜后在下表面反射。"
          },
          {
            "text": "这两束反射光重新会合，由于走过的路程不同，它们之间产生光程差。"
          },
          {
            "text": "光在薄膜内传播，光程要乘以折射率 n，往返一次光程差就是 2nd。"
          },
          {
            "text": "光从光疏射向光密介质反射时会有半波损失，相当于额外多出半个波长。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "考虑半波损失后，反射加强即看到亮色的条件如下。",
            "formula": "2nd = (k + \\tfrac{1}{2})\\lambda"
          },
          {
            "text": "反射减弱、变暗的条件是 2nd 等于波长的整数倍。",
            "formula": "2nd = k\\lambda"
          },
          {
            "text": "其中 n 是薄膜折射率，d 是薄膜厚度，λ 是光在真空中的波长。"
          },
          {
            "text": "不同厚度对应不同波长的加强，所以薄膜会呈现随厚度变化的彩色。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调整薄膜厚度，观察反射光的颜色如何随之改变。"
          },
          {
            "text": "改变折射率，光程差随之变化，加强的波长也会移动。"
          },
          {
            "text": "注意厚度的微小变化，就能让颜色在彩虹中循环变换。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "相机镜头的增透膜，正是利用薄膜干涉让反射光相消，提高透光率。"
          },
          {
            "text": "钞票和证件上的防伪膜，会随角度变换颜色，难以仿造。"
          },
          {
            "text": "工业上用薄膜干涉精确测量微小的厚度和平整度。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "薄膜干涉来自上下表面两束反射光的叠加，光程差为 2nd。"
          },
          {
            "text": "考虑半波损失，反射加强条件为 2nd 等于半整数倍波长。"
          },
          {
            "text": "从肥皂泡到增透膜，薄膜干涉装点并改善着我们的世界。希望你已经看懂这层色彩！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "增透膜",
        "description": "相机镜头镀膜如何减少反射"
      },
      {
        "title": "牛顿环",
        "description": "球面薄膜产生的同心圆环"
      }
    ]
  },
  {
    "slug": "polarization",
    "title": "偏振与马吕斯定律",
    "subtitle": "光的横波本质与偏振片",
    "category": "光学",
    "difficulty": "intermediate",
    "targetAge": "16-18岁",
    "sourcePath": "/polarization",
    "sourceChunk": "PolarizationExperiment-Diy76Pt9.js",
    "objectives": [
      "理解光的偏振与横波性质",
      "掌握马吕斯定律",
      "认识起偏器与检偏器"
    ],
    "prerequisites": [
      "光的波动性",
      "横波",
      "光强"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到偏振实验！戴上偏光太阳镜，刺眼的水面反光就消失了，这就是偏振的妙用。"
          },
          {
            "text": "普通光的振动方向杂乱无章，而偏振光只在一个方向上振动。"
          },
          {
            "text": "偏振现象证明了光是横波，今天我们就来探索它的规律。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "光是横波，电场的振动方向垂直于传播方向。"
          },
          {
            "text": "自然光在各个方向都有振动，是非偏振光。"
          },
          {
            "text": "偏振片只允许特定方向的振动通过，把自然光变成偏振光，这叫起偏。"
          },
          {
            "text": "第二块偏振片用来检验偏振方向，叫做检偏器。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "偏振光通过检偏器后的强度，由马吕斯定律给出。",
            "formula": "I = I_0\\cos^2\\theta"
          },
          {
            "text": "其中 θ 是两块偏振片透振方向的夹角。"
          },
          {
            "text": "当两片平行，θ 为零，光全部通过，强度最大。"
          },
          {
            "text": "当两片垂直，θ 为 90 度，光被完全挡住，强度为零。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "旋转检偏器，观察透射光强度随夹角变化。"
          },
          {
            "text": "夹角从 0 到 90 度，强度按 cos 平方规律从最大降到零。"
          },
          {
            "text": "注意每旋转半圈，会经历两次最亮和两次全暗。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "偏光太阳镜过滤水平偏振的反光，让视野更清晰。"
          },
          {
            "text": "液晶显示器利用偏振光的旋转来控制每个像素的明暗。"
          },
          {
            "text": "摄影中的偏振镜能压暗天空、增强反差。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "光是横波，偏振片可把自然光变成偏振光。"
          },
          {
            "text": "马吕斯定律 I 等于 I0 乘以 cos 平方 θ，描述检偏后的强度。"
          },
          {
            "text": "从太阳镜到液晶屏，偏振技术无处不在。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "偏光太阳镜",
        "description": "偏振如何消除反光"
      },
      {
        "title": "液晶显示器",
        "description": "偏振光在屏幕中的应用"
      }
    ]
  },
  {
    "slug": "prism-dispersion",
    "title": "棱镜色散",
    "subtitle": "白光分解成绚丽光谱",
    "category": "光学",
    "difficulty": "intermediate",
    "targetAge": "15-18岁",
    "sourcePath": "/prism-dispersion",
    "sourceChunk": "PrismDispersionExperiment-cw7cc4Xu.js",
    "objectives": [
      "理解色散的成因",
      "认识折射率随波长的变化",
      "了解牛顿的光谱实验"
    ],
    "prerequisites": [
      "光的折射",
      "折射率",
      "波长与颜色"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到棱镜色散实验！一束白光穿过三棱镜，竟分解成红橙黄绿蓝靛紫的彩带。"
          },
          {
            "text": "1666 年，牛顿用这个实验证明白光是由各种颜色的光混合而成的。"
          },
          {
            "text": "今天我们就来看看，棱镜是如何把白光拆解成绚丽光谱的。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "不同颜色的光在玻璃中的传播速度略有不同，因此折射率也不同。"
          },
          {
            "text": "紫光折射率最大，偏折最厉害；红光折射率最小，偏折最轻。"
          },
          {
            "text": "白光进入棱镜后，各色光按不同角度折射，于是分开了。"
          },
          {
            "text": "这种折射率随波长变化的现象，就叫色散。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "折射率随波长的变化可以用柯西公式近似描述。",
            "formula": "n(\\lambda) = A + \\frac{B}{\\lambda^2}"
          },
          {
            "text": "波长越短，折射率越大，所以紫光偏折更多。"
          },
          {
            "text": "每种颜色都遵守斯涅尔折射定律，只是折射率不同。",
            "formula": "n_1\\sin\\theta_1 = n_2\\sin\\theta_2"
          },
          {
            "text": "棱镜的两次折射累加了色散效果，使光谱展得更开。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调整入射角，观察出射光谱的位置和展开程度。"
          },
          {
            "text": "增大棱镜的色散系数，光谱被拉得更宽，颜色分得更开。"
          },
          {
            "text": "注意红光始终在偏折最小的一侧，紫光在偏折最大的一侧。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "彩虹就是阳光在雨滴中色散和反射形成的。"
          },
          {
            "text": "分光仪用棱镜或光栅把光分解，分析物质的成分。"
          },
          {
            "text": "但色散在透镜中会造成色差，需要特殊设计来校正。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "色散源于折射率随波长变化，紫光偏折大、红光偏折小。"
          },
          {
            "text": "柯西公式 n 等于 A 加 B 除以 λ 平方，描述这种变化。"
          },
          {
            "text": "从牛顿的实验到彩虹，色散展现了光的丰富色彩。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "彩虹的形成",
        "description": "水滴的色散与全反射"
      },
      {
        "title": "光谱分析",
        "description": "从光谱识别物质成分"
      }
    ]
  },
  {
    "slug": "newton-rings",
    "title": "牛顿环",
    "subtitle": "等厚干涉形成的同心圆环",
    "category": "光学",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/newton-rings",
    "sourceChunk": "NewtonRingsExperiment-0Xts8V_O.js",
    "objectives": [
      "理解等厚干涉的原理",
      "掌握牛顿环半径公式",
      "认识半波损失的影响"
    ],
    "prerequisites": [
      "薄膜干涉",
      "光程差",
      "半波损失"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到牛顿环实验！把一个平凸透镜压在平板玻璃上，照以单色光，会出现一圈圈同心圆环。"
          },
          {
            "text": "这些明暗相间的圆环，由牛顿首先仔细研究，因此得名牛顿环。"
          },
          {
            "text": "它是等厚干涉的经典范例，今天我们就来探索它的成因与规律。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "透镜凸面与平板之间形成一层厚度逐渐变化的空气薄膜。"
          },
          {
            "text": "从空气膜上下表面反射的两束光发生干涉。"
          },
          {
            "text": "厚度相同的地方干涉效果相同，所以条纹是一圈圈同心圆。"
          },
          {
            "text": "由于反射时的半波损失，正中心接触点处是一个暗斑。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "第 k 个暗环的半径由这个公式给出。",
            "formula": "r_k = \\sqrt{k\\lambda R}"
          },
          {
            "text": "其中 R 是透镜的曲率半径，λ 是光的波长，k 是环的序号。"
          },
          {
            "text": "环的半径与序号的平方根成正比，所以越往外环越密。"
          },
          {
            "text": "由此测出环半径，就能反推透镜的曲率半径或光的波长。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调整波长，观察环的颜色和间距如何变化。"
          },
          {
            "text": "增大透镜曲率半径 R，环会变得更稀疏。"
          },
          {
            "text": "注意中心始终是暗斑，环从内向外越来越密。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "牛顿环可以精密测量透镜的曲率半径。"
          },
          {
            "text": "光学车间用干涉条纹检验镜面的平整度和加工质量。"
          },
          {
            "text": "同样的原理也用于检测玻璃的均匀性和应力。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "牛顿环是空气薄膜的等厚干涉，形成同心圆环。"
          },
          {
            "text": "暗环半径 r 等于根号下 k λ R，中心因半波损失为暗斑。"
          },
          {
            "text": "它是测量曲率半径和检验光学面的利器。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "测量透镜曲率半径",
        "description": "牛顿环的精密测量应用"
      },
      {
        "title": "光学表面检验",
        "description": "用干涉条纹检查平整度"
      }
    ]
  },
  {
    "slug": "michelson-interferometer",
    "title": "迈克尔逊干涉仪",
    "subtitle": "用光的干涉测量纳米级长度变化",
    "category": "光学",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/michelson-interferometer",
    "sourceChunk": "MichelsonInterferometerExperiment-BH7BjmbU.js",
    "objectives": [
      "理解分振幅干涉的基本原理",
      "掌握光程差与条纹移动的关系",
      "认识干涉仪在精密测量中的应用"
    ],
    "prerequisites": [
      "光的干涉",
      "光程差",
      "相干光"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到迈克尔逊干涉仪！它是人类制造过的最精密的测量工具之一。"
          },
          {
            "text": "一束光被分成两路，走过不同的路径后再相遇，叠加出明暗交替的条纹。"
          },
          {
            "text": "只要一面镜子移动头发丝的万分之一，条纹就会肉眼可见地移动。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "激光经过一块半透半反的分光镜，被分成两束。"
          },
          {
            "text": "两束光分别射向两面反射镜，再原路返回到分光镜汇合。"
          },
          {
            "text": "两路光程不同，会产生相位差，从而干涉。"
          },
          {
            "text": "移动其中一面镜子，就改变了光程差，条纹随之吞吐移动。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "两束光的光程差等于镜子移动距离的两倍，因为光要往返。",
            "formula": "\\Delta L = 2d"
          },
          {
            "text": "当光程差是波长的整数倍时，干涉相长，呈现亮条纹。",
            "formula": "2d = m\\lambda"
          },
          {
            "text": "镜子每移动半个波长，中心就吞吐一个完整的条纹。",
            "formula": "\\Delta d = \\dfrac{\\lambda}{2}"
          },
          {
            "text": "数清吞吐的条纹数，就能反推出纳米级的位移。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "拖动滑块移动反射镜，观察中心条纹的吞吐。"
          },
          {
            "text": "改变波长，看看条纹的疏密和颜色如何变化。"
          },
          {
            "text": "统计移动镜子时数过的条纹数，验证位移公式。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "1887 年迈克尔逊-莫雷实验用它否定了以太，为相对论铺路。"
          },
          {
            "text": "今天的 LIGO 用四公里长的干涉仪，探测到了引力波。"
          },
          {
            "text": "它还广泛用于精密测长、光谱分析和折射率测量。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "迈克尔逊干涉仪把一束光分成两路，靠光程差产生干涉条纹。"
          },
          {
            "text": "镜子每移动半个波长，条纹吞吐一次，由此实现纳米级测量。"
          },
          {
            "text": "从否定以太到探测引力波，它见证了物理学的重大突破。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "迈克尔逊-莫雷实验",
        "description": "否定以太、催生相对论"
      },
      {
        "title": "LIGO 引力波探测",
        "description": "干涉仪测量时空涟漪"
      }
    ]
  },
  {
    "slug": "thermal-expansion",
    "title": "热膨胀",
    "subtitle": "探索物体受热膨胀的规律",
    "category": "热学",
    "difficulty": "beginner",
    "targetAge": "12-15岁",
    "sourcePath": "/thermal-expansion",
    "sourceChunk": "ThermalExpansionExperiment-CPys2NFT.js",
    "objectives": [
      "理解热膨胀现象",
      "掌握线膨胀系数",
      "了解热膨胀的应用"
    ],
    "prerequisites": [
      "温度的概念",
      "物质的微观结构"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到热膨胀实验！今天我们要探索物体受热后的变化。"
          },
          {
            "text": "你是否注意过，铁轨之间为什么要留有缝隙？"
          },
          {
            "text": "这就是为了应对热膨胀，让我们一起来了解这个现象。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "热膨胀是指物体受热时体积增大的现象。"
          },
          {
            "text": "从微观角度看，温度升高使分子运动加剧，分子间距增大。"
          },
          {
            "text": "固体、液体、气体都会发生热膨胀，气体膨胀最明显。"
          },
          {
            "text": "不同材料的膨胀程度不同，用膨胀系数来描述。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "线膨胀公式：ΔL 等于 α 乘以 L0 乘以 ΔT。",
            "formula": "\\Delta L = \\alpha L_0 \\Delta T"
          },
          {
            "text": "其中 α 是线膨胀系数，L0 是原长，ΔT 是温度变化。"
          },
          {
            "text": "体膨胀系数约等于线膨胀系数的三倍。",
            "formula": "\\beta \\approx 3\\alpha"
          },
          {
            "text": "铝的膨胀系数约为钢的两倍。"
          }
        ]
      },
      {
        "id": "animation",
        "title": "动画演示",
        "lines": [
          {
            "text": "图中显示了金属棒受热膨胀的过程。"
          },
          {
            "text": "随着温度升高，金属棒的长度逐渐增加。"
          },
          {
            "text": "不同材料的膨胀程度明显不同。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调整温度，观察物体长度的变化。"
          },
          {
            "text": "切换不同材料，比较它们的膨胀程度。"
          },
          {
            "text": "观察双金属片在温度变化时的弯曲。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "铁轨接缝、桥梁伸缩缝都是为了应对热膨胀。"
          },
          {
            "text": "双金属片温度计利用不同金属膨胀系数的差异。"
          },
          {
            "text": "热缩管利用材料的热收缩特性进行密封。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "让我们总结一下今天学到的内容。"
          },
          {
            "text": "热膨胀是物体受热体积增大的现象，由分子运动加剧引起。"
          },
          {
            "text": "膨胀量与温度变化、原长和膨胀系数成正比。"
          },
          {
            "text": "希望通过这个实验，你对热膨胀有了更深入的理解！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "水的反常膨胀",
        "description": "了解水在4度时密度最大的特殊现象"
      },
      {
        "title": "热应力",
        "description": "探索热膨胀受阻产生的应力"
      }
    ]
  },
  {
    "slug": "ideal-gas",
    "title": "理想气体",
    "subtitle": "探索气体的压强、体积和温度关系",
    "category": "热学",
    "difficulty": "intermediate",
    "targetAge": "15-18岁",
    "sourcePath": "/ideal-gas",
    "sourceChunk": "IdealGasExperiment-CTsJOUAT.js",
    "objectives": [
      "理解理想气体模型",
      "掌握理想气体状态方程",
      "观察等温、等压、等容过程"
    ],
    "prerequisites": [
      "温度和热量",
      "压强的概念"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到理想气体实验！今天我们要探索气体的宏观性质。"
          },
          {
            "text": "为什么轮胎在夏天容易爆胎？为什么高压锅能更快煮熟食物？"
          },
          {
            "text": "这些都与气体的压强、体积和温度的关系有关。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "理想气体是一种理想化模型，忽略分子体积和分子间作用力。"
          },
          {
            "text": "气体的状态由压强 P、体积 V 和温度 T 三个量描述。"
          },
          {
            "text": "等温过程中温度不变，等压过程中压强不变，等容过程中体积不变。"
          },
          {
            "text": "实际气体在高温低压下接近理想气体。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "理想气体状态方程：PV 等于 nRT。",
            "formula": "PV = nRT"
          },
          {
            "text": "其中 n 是物质的量，R 是气体常数，T 是绝对温度。"
          },
          {
            "text": "等温过程：P1V1 等于 P2V2，这是玻意耳定律。",
            "formula": "P_1V_1 = P_2V_2"
          },
          {
            "text": "等压过程：V1 除以 T1 等于 V2 除以 T2，这是盖-吕萨克定律。"
          }
        ]
      },
      {
        "id": "animation",
        "title": "动画演示",
        "lines": [
          {
            "text": "图中显示了气体分子在容器中的运动。"
          },
          {
            "text": "分子不断撞击容器壁，产生压强。"
          },
          {
            "text": "温度越高，分子运动越剧烈，压强越大。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调整温度，观察压强和体积的变化。"
          },
          {
            "text": "压缩活塞，观察气体压强的增大。"
          },
          {
            "text": "切换不同的热力学过程，观察 PV 图的变化。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "内燃机利用气体膨胀做功驱动汽车。"
          },
          {
            "text": "空调和冰箱利用气体压缩和膨胀进行热量传递。"
          },
          {
            "text": "气象学利用气体定律预测天气变化。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "让我们总结一下今天学到的内容。"
          },
          {
            "text": "理想气体状态方程 PV=nRT 描述了气体的宏观性质。"
          },
          {
            "text": "等温、等压、等容过程各有其特定的规律。"
          },
          {
            "text": "希望通过这个实验，你对理想气体有了更深入的理解！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "热力学第一定律",
        "description": "了解能量守恒在热学中的应用"
      },
      {
        "title": "卡诺循环",
        "description": "探索热机效率的理论极限"
      }
    ]
  },
  {
    "slug": "carnot-cycle",
    "title": "卡诺循环",
    "subtitle": "理解理想热机与最高效率",
    "category": "热学",
    "difficulty": "advanced",
    "targetAge": "16-18岁",
    "sourcePath": "/carnot-cycle",
    "sourceChunk": "CarnotCycleExperiment-CtJBpdk_.js",
    "objectives": [
      "理解卡诺循环的四个过程",
      "掌握卡诺热机效率公式 η = 1 - Tc/Th",
      "认识热机效率的理论上限"
    ],
    "prerequisites": [
      "理想气体状态方程",
      "热力学第一定律",
      "PV 图"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到卡诺循环实验！1824 年，年轻的工程师卡诺提出了一个理想热机模型。"
          },
          {
            "text": "它回答了一个根本问题：热机的效率到底能有多高？"
          },
          {
            "text": "卡诺循环是效率最高的热机循环，它揭示了热力学第二定律的深刻内涵。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "卡诺循环由四个过程组成，在 PV 图上构成一个封闭曲线。"
          },
          {
            "text": "第一步是等温膨胀，气体在高温热源吸收热量，对外做功。"
          },
          {
            "text": "第二步是绝热膨胀，气体不与外界交换热量，温度从高温降到低温。"
          },
          {
            "text": "第三步等温压缩向低温热源放热，第四步绝热压缩回到起点，完成一次循环。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "卡诺热机的效率只与高温和低温热源的温度有关。",
            "formula": "\\eta = 1 - \\frac{T_c}{T_h}"
          },
          {
            "text": "其中 Th 是高温热源温度，Tc 是低温热源温度，都用绝对温度开尔文表示。"
          },
          {
            "text": "温差越大，效率越高；但只要低温热源不是绝对零度，效率就永远小于百分之百。"
          },
          {
            "text": "这是任何工作在两个温度之间的热机所能达到的效率上限。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "试着提高高温热源温度 Th，观察 PV 图上循环面积变大，效率提升。"
          },
          {
            "text": "降低低温热源温度 Tc，效率也会提高，因为温差增大了。"
          },
          {
            "text": "PV 图中封闭曲线包围的面积，正是这一循环对外输出的净功。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "现实中的蒸汽机、内燃机效率都远低于卡诺极限，但卡诺循环为它们指明了改进方向。"
          },
          {
            "text": "发电厂提高蒸汽温度，正是为了逼近更高的卡诺效率。"
          },
          {
            "text": "反向运行的卡诺循环就是制冷机和热泵的理论基础。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "卡诺循环包含等温膨胀、绝热膨胀、等温压缩、绝热压缩四个过程。"
          },
          {
            "text": "它的效率 η 等于 1 减去 Tc 除以 Th，是热机效率的理论上限。"
          },
          {
            "text": "卡诺的思想奠定了热力学第二定律的基础。希望你已经理解了它的精妙！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "热力学第二定律",
        "description": "为什么热机效率无法达到 100%"
      },
      {
        "title": "熵与不可逆过程",
        "description": "卡诺循环为何是可逆的理想模型"
      }
    ]
  },
  {
    "slug": "heat-conduction",
    "title": "热传导",
    "subtitle": "观察温度场的扩散与不同材料的导热",
    "category": "热学",
    "difficulty": "intermediate",
    "targetAge": "16-18岁",
    "sourcePath": "/heat-conduction",
    "sourceChunk": "HeatConductionExperiment-CkAC0BC_.js",
    "objectives": [
      "理解热传导是热量从高温向低温的传递",
      "认识热扩散方程与热扩散率",
      "比较不同材料的导热能力"
    ],
    "prerequisites": [
      "温度与热量概念",
      "导数与变化率"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到热传导实验！把一根金属棒的一端放在火上，另一端很快也会变烫。"
          },
          {
            "text": "热量是怎么从热的一端传到冷的一端的？这就是热传导。"
          },
          {
            "text": "今天我们用温度场的颜色变化，直观地看到热量如何扩散。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "热传导是热量从高温区域向低温区域的自发传递，不需要物质宏观移动。"
          },
          {
            "text": "温度差越大，传热越快；当各处温度相同时，传热停止，达到热平衡。"
          },
          {
            "text": "不同材料的导热能力差别很大，金属导热快，木头和泡沫导热慢。"
          },
          {
            "text": "衡量材料传热快慢的物理量，叫做热扩散率。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "温度随时间和位置的变化，遵循热扩散方程。",
            "formula": "\\frac{\\partial T}{\\partial t} = \\alpha\\frac{\\partial^2 T}{\\partial x^2}"
          },
          {
            "text": "其中 α 是热扩散率，等于导热系数除以密度和比热容的乘积。",
            "formula": "\\alpha = \\frac{k}{\\rho c}"
          },
          {
            "text": "热扩散率越大，温度变化传播得越快。"
          },
          {
            "text": "这个方程说明，某点温度的变化快慢，取决于它周围温度的弯曲程度。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "选择不同的材料，比较铜、钢和玻璃的导热速度差异。"
          },
          {
            "text": "铜的热扩散率最大，你会看到红色高温区域迅速向右扩展。"
          },
          {
            "text": "玻璃导热慢，温度场扩散得很缓慢，适合做隔热。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "炒锅用导热快的金属，把手却用导热慢的材料，防止烫手。"
          },
          {
            "text": "电脑 CPU 用铜或热管把热量快速导走，再由风扇散掉。"
          },
          {
            "text": "房屋的保温层用低导热材料，减少冬天的热量流失。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "热传导是热量从高温向低温的传递，遵循热扩散方程。"
          },
          {
            "text": "热扩散率 α 等于 k 除以 ρc，决定温度变化的传播快慢。"
          },
          {
            "text": "理解热传导，能帮我们设计更好的散热和保温方案。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "保温材料",
        "description": "低导热系数材料如何减少热损失"
      },
      {
        "title": "散热设计",
        "description": "CPU 散热器与高导热金属"
      }
    ]
  },
  {
    "slug": "brownian-motion",
    "title": "布朗运动",
    "subtitle": "悬浮微粒永不停息的随机舞蹈",
    "category": "热学",
    "difficulty": "intermediate",
    "targetAge": "15-18岁",
    "sourcePath": "/brownian-motion",
    "sourceChunk": "BrownianMotionExperiment-D5tqu30V.js",
    "objectives": [
      "理解布朗运动的微观成因",
      "认识随机游走与扩散",
      "掌握爱因斯坦扩散关系"
    ],
    "prerequisites": [
      "分子热运动",
      "温度",
      "统计平均"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到布朗运动实验！1827 年，植物学家布朗在显微镜下观察花粉颗粒。"
          },
          {
            "text": "他发现这些微粒在水中不停地、毫无规律地颤动，却找不到原因。"
          },
          {
            "text": "近八十年后，爱因斯坦给出了解释，并由此为原子的真实存在提供了铁证。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "悬浮在液体中的微粒，时刻被周围大量做热运动的分子撞击。"
          },
          {
            "text": "某一瞬间，各方向的撞击难以完全抵消，微粒便被推向某个方向。"
          },
          {
            "text": "下一瞬间撞击的合力又指向别处，于是微粒走出曲折的随机路径。"
          },
          {
            "text": "温度越高，分子运动越剧烈，布朗运动也越显著。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "爱因斯坦发现，微粒位移的平方平均值随时间线性增长。",
            "formula": "\\langle x^2 \\rangle = 2Dt"
          },
          {
            "text": "其中 D 是扩散系数，描述微粒扩散的快慢。"
          },
          {
            "text": "扩散系数与温度成正比，与黏度和粒径成反比。",
            "formula": "D = \\frac{k_B T}{6\\pi\\eta r}"
          },
          {
            "text": "这个关系把宏观可测的扩散，和微观的分子运动联系了起来。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "观察多个微粒同时做无规则游走，画出各自曲折的轨迹。"
          },
          {
            "text": "提高温度，微粒运动明显加剧，扩散更快。"
          },
          {
            "text": "注意位移平方的平均值随时间线性增长，符合爱因斯坦关系。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "布朗运动是测定阿伏伽德罗常数的经典途径之一。"
          },
          {
            "text": "随机游走模型广泛用于扩散、聚合物和金融市场分析。"
          },
          {
            "text": "在生物学中，它解释了细胞内分子的输运过程。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "布朗运动源于液体分子对悬浮微粒的无规则撞击。"
          },
          {
            "text": "微粒位移平方的平均值随时间线性增长，符合 2Dt 关系。"
          },
          {
            "text": "这一现象证实了分子的真实存在，是统计物理的里程碑。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "爱因斯坦与原子论",
        "description": "布朗运动如何证实分子存在"
      },
      {
        "title": "随机过程",
        "description": "维纳过程与金融数学"
      }
    ]
  },
  {
    "slug": "maxwell-distribution",
    "title": "麦克斯韦速率分布",
    "subtitle": "气体分子速率的统计规律",
    "category": "热学",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/maxwell-distribution",
    "sourceChunk": "MaxwellDistributionExperiment-B6kBMboX.js",
    "objectives": [
      "理解气体分子速率的统计分布",
      "掌握最概然、平均、方均根速率",
      "认识温度对速率分布的影响"
    ],
    "prerequisites": [
      "理想气体",
      "分子动理论",
      "概率分布"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到麦克斯韦速率分布实验！一瓶气体里有无数分子，它们的速率各不相同。"
          },
          {
            "text": "有的跑得快，有的跑得慢，但整体上却遵循一条优美的统计曲线。"
          },
          {
            "text": "麦克斯韦最早用统计方法揭示了这个分布，开创了统计物理的先河。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "气体分子不停地碰撞，速率时刻在变，但分布形态保持稳定。"
          },
          {
            "text": "速率分布曲线呈不对称的钟形，从零开始上升，到峰值后缓慢下降。"
          },
          {
            "text": "曲线下的面积代表分子总数，峰值对应最常见的速率。"
          },
          {
            "text": "温度越高，曲线越向高速端展开，峰变低变宽。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "麦克斯韦速率分布函数的形式如下。",
            "formula": "f(v) = 4\\pi\\left(\\frac{m}{2\\pi k_B T}\\right)^{3/2} v^2 e^{-mv^2/2k_BT}"
          },
          {
            "text": "最概然速率对应曲线峰值，等于根号下 2kT 比 m。",
            "formula": "v_p = \\sqrt{\\frac{2k_BT}{m}}"
          },
          {
            "text": "平均速率略大于最概然速率，方均根速率又更大一些。",
            "formula": "v_p < \\bar{v} < v_{rms}"
          },
          {
            "text": "三种特征速率都与温度的平方根成正比。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "提高温度，观察分布曲线整体右移、变得更宽更平。"
          },
          {
            "text": "注意三条竖线分别标出最概然、平均和方均根速率。"
          },
          {
            "text": "改变气体分子质量，看轻分子的速率分布比重分子更宽。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "速率分布解释了为什么液体在任何温度都能蒸发——总有快分子能逃逸。"
          },
          {
            "text": "它是理解气体扩散、热传导和反应速率的基础。"
          },
          {
            "text": "行星大气能否保住轻气体，也取决于分子速率与逃逸速度的比较。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "气体分子速率遵循麦克斯韦分布，呈不对称的钟形曲线。"
          },
          {
            "text": "最概然、平均、方均根速率依次增大，都正比于温度的平方根。"
          },
          {
            "text": "温度越高分布越展开。这是统计物理的经典成果。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "玻尔兹曼分布",
        "description": "能量在粒子间的统计分配"
      },
      {
        "title": "气体扩散与逸出",
        "description": "速率分布的实际应用"
      }
    ]
  },
  {
    "slug": "blackbody-radiation",
    "title": "黑体辐射与普朗克定律",
    "subtitle": "量子论诞生的起点",
    "category": "热学",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/blackbody-radiation",
    "sourceChunk": "BlackbodyRadiationExperiment-DIg2Y50H.js",
    "objectives": [
      "理解黑体辐射谱与普朗克定律",
      "掌握维恩位移定律",
      "认识斯特藩-玻尔兹曼定律"
    ],
    "prerequisites": [
      "热辐射",
      "波长与频率",
      "温度"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到黑体辐射实验！一块铁加热后会先变红、再变橙、最后发白，这就是热辐射。"
          },
          {
            "text": "物体的辐射光谱只取决于温度，这个规律困扰了十九世纪末的物理学家。"
          },
          {
            "text": "为了解释它，普朗克提出能量量子化的假设，由此打开了量子世界的大门。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "黑体是能完全吸收所有入射辐射的理想物体，也是最理想的辐射体。"
          },
          {
            "text": "它的辐射强度随波长分布，形成一条只由温度决定的曲线。"
          },
          {
            "text": "温度升高，曲线整体抬高，峰值向短波方向移动。"
          },
          {
            "text": "经典理论在短波端预言无穷大的能量，称为紫外灾难，与实验严重不符。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "普朗克假设能量只能以量子形式发射，得到了正确的辐射公式。",
            "formula": "B(\\lambda,T) = \\frac{2hc^2}{\\lambda^5}\\frac{1}{e^{hc/\\lambda k_B T}-1}"
          },
          {
            "text": "维恩位移定律给出峰值波长与温度的反比关系。",
            "formula": "\\lambda_{max} T = b \\approx 2.898\\times10^{-3}\\,\\text{m·K}"
          },
          {
            "text": "斯特藩-玻尔兹曼定律给出总辐射功率，正比于温度的四次方。",
            "formula": "j = \\sigma T^4"
          },
          {
            "text": "温度稍稍升高，辐射总功率就急剧增加。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "提高温度，观察辐射曲线整体升高、峰值向蓝紫端移动。"
          },
          {
            "text": "注意峰值波长的位置，它与温度成反比，符合维恩位移定律。"
          },
          {
            "text": "感受总辐射功率随温度四次方急剧增长的威力。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "我们通过恒星的颜色判断它的表面温度，蓝星比红星更热。"
          },
          {
            "text": "红外测温仪利用黑体辐射，远距离测量物体温度。"
          },
          {
            "text": "宇宙微波背景辐射是一个温度约 2.7 K 的完美黑体谱。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "黑体辐射谱只由温度决定，普朗克定律给出了正确描述。"
          },
          {
            "text": "维恩位移定律 λ_max·T 为常数，斯特藩-玻尔兹曼定律 j 正比于 T 四次方。"
          },
          {
            "text": "为解释它，普朗克提出能量量子化，开创了量子物理。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "紫外灾难",
        "description": "经典理论的失败与量子的诞生"
      },
      {
        "title": "宇宙微波背景",
        "description": "完美黑体谱的宇宙学证据"
      }
    ]
  },
  {
    "slug": "phase-diagram",
    "title": "物态相变与相图",
    "subtitle": "温度压强如何决定固液气三态",
    "category": "热学",
    "difficulty": "intermediate",
    "targetAge": "16-17岁",
    "sourcePath": "/phase-diagram",
    "sourceChunk": "PhaseDiagramExperiment-63HNLYLW.js",
    "objectives": [
      "理解 P-T 相图中三个相区的含义",
      "认识三相点与临界点",
      "掌握相变与潜热的概念"
    ],
    "prerequisites": [
      "温度与压强",
      "理想气体",
      "内能"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到物态相变！水可以是冰、是液体、也是蒸汽，决定它的是温度和压强。"
          },
          {
            "text": "把温度和压强画成一张图，就得到了相图——物质的状态地图。"
          },
          {
            "text": "图上有三条边界线，把固、液、气三个相区清晰地分开。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "相图的横轴是温度，纵轴是压强，每个点代表一组确定的条件。"
          },
          {
            "text": "三条曲线分别是熔化线、汽化线和升华线，跨过它们就发生相变。"
          },
          {
            "text": "三条线交于一点，叫三相点，三种状态在此共存。"
          },
          {
            "text": "汽化线终止于临界点，越过它，液体和气体不再有分别。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "相变时吸收或放出潜热，而温度保持不变。",
            "formula": "Q = mL"
          },
          {
            "text": "相平衡线的斜率由克拉佩龙方程决定。",
            "formula": "\\dfrac{dP}{dT} = \\dfrac{L}{T\\,\\Delta V}"
          },
          {
            "text": "水的熔化线向左倾斜，所以加压反而让冰融化，这很反常。"
          },
          {
            "text": "正是这一点，让滑冰和冰川流动成为可能。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "拖动温度和压强滑块，让状态点在相图上移动。"
          },
          {
            "text": "观察状态点落在哪个相区，对应固、液还是气。"
          },
          {
            "text": "把状态点移过临界点，体会超临界流体的连续过渡。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "高压锅利用提高压强抬高沸点，让食物更快煮熟。"
          },
          {
            "text": "冻干食品利用升华，在低压下让冰直接变成水汽。"
          },
          {
            "text": "超临界二氧化碳被用于咖啡脱因和环保萃取。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "相图用温度和压强描述物质的固、液、气三态。"
          },
          {
            "text": "三相点三态共存，临界点之上液气不分。"
          },
          {
            "text": "相变伴随潜热，温度不变。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "水的反常相图",
        "description": "为何冰会浮在水面"
      },
      {
        "title": "超临界流体",
        "description": "临界点之上的奇特状态"
      }
    ]
  },
  {
    "slug": "diffusion",
    "title": "分子扩散",
    "subtitle": "从无序运动到浓度均衡",
    "category": "热学",
    "difficulty": "intermediate",
    "targetAge": "16-17岁",
    "sourcePath": "/diffusion",
    "sourceChunk": "DiffusionExperiment-CqzctI_E.js",
    "objectives": [
      "理解扩散的微观机制",
      "掌握菲克定律",
      "认识浓度梯度与熵增"
    ],
    "prerequisites": [
      "分子热运动",
      "浓度",
      "随机游走"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎观察扩散！一滴墨水滴入清水，会慢慢晕染开来。"
          },
          {
            "text": "没有人去搅动，分子却自发地从密集走向稀疏。"
          },
          {
            "text": "这就是扩散，热运动驱动下的浓度均衡过程。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "分子无时无刻不在做无规则的热运动，方向随机。"
          },
          {
            "text": "在浓度高的地方，分子多，向外迁移的也多。"
          },
          {
            "text": "净效果是分子从高浓度流向低浓度。"
          },
          {
            "text": "最终浓度处处相等，系统达到熵最大的平衡态。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "菲克第一定律：扩散通量正比于浓度梯度。",
            "formula": "J = -D\\dfrac{dC}{dx}"
          },
          {
            "text": "负号表示分子总是逆着浓度梯度、向低浓度流动。"
          },
          {
            "text": "扩散距离随时间的平方根增长。",
            "formula": "\\langle x^2\\rangle = 2Dt"
          },
          {
            "text": "扩散系数 D 越大，物质散开得越快。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调节扩散系数，观察墨滴散开的快慢。"
          },
          {
            "text": "推进时间，看浓度分布如何逐渐展平。"
          },
          {
            "text": "注意扩散宽度与时间平方根的关系。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "细胞靠扩散完成氧气和养分的跨膜运输。"
          },
          {
            "text": "半导体掺杂利用高温扩散控制杂质分布。"
          },
          {
            "text": "香味在空气中飘散，也是扩散的日常体现。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "扩散源于分子热运动，使物质从高浓度流向低浓度。"
          },
          {
            "text": "菲克定律 J=-D·dC/dx 描述了扩散通量。"
          },
          {
            "text": "扩散是熵增的体现，趋向均匀。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "布朗运动",
        "description": "扩散的微观随机性"
      },
      {
        "title": "细胞膜的物质运输",
        "description": "生命中的扩散"
      }
    ]
  },
  {
    "slug": "joule-thomson",
    "title": "焦耳-汤姆孙效应",
    "subtitle": "气体节流膨胀时的温度变化",
    "category": "热学",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/joule-thomson",
    "sourceChunk": "JouleThomsonExperiment-Crv3Fa4h.js",
    "objectives": [
      "理解节流过程的焓守恒",
      "掌握焦汤系数与转换温度",
      "认识气体液化原理"
    ],
    "prerequisites": [
      "焓",
      "实际气体",
      "分子间作用力"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎了解焦耳-汤姆孙效应！把高压气体从小孔放出，它会变冷还是变热？"
          },
          {
            "text": "答案取决于气体种类和温度，这背后藏着分子间作用力的秘密。"
          },
          {
            "text": "正是这个效应，让人类得以把空气液化。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "气体缓慢通过多孔塞从高压区流向低压区，叫节流膨胀。"
          },
          {
            "text": "这个过程绝热且焓保持不变。"
          },
          {
            "text": "对实际气体，分子间存在吸引力，膨胀时要克服吸引做功。"
          },
          {
            "text": "于是分子平均动能下降，气体温度降低。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "节流过程焓守恒。",
            "formula": "H_1 = H_2"
          },
          {
            "text": "焦汤系数描述温度随压强的变化。",
            "formula": "\\mu_{JT}=\\left(\\dfrac{\\partial T}{\\partial P}\\right)_H"
          },
          {
            "text": "系数为正则膨胀致冷，为负则致热。"
          },
          {
            "text": "两者的分界叫转换温度，低于它膨胀才会致冷。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调节初始温度，观察节流后是致冷还是致热。"
          },
          {
            "text": "改变压降，看温度变化的幅度。"
          },
          {
            "text": "注意温度跨过转换温度时效应的反转。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "林德循环靠焦汤致冷反复降温，最终液化空气。"
          },
          {
            "text": "它是工业上制取液氮、液氧的基础。"
          },
          {
            "text": "家用冰箱和空调的制冷也用到类似的节流原理。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "焦耳-汤姆孙效应是气体节流膨胀时的温度变化，过程焓守恒。"
          },
          {
            "text": "焦汤系数正致冷、负致热，分界是转换温度。"
          },
          {
            "text": "它是气体液化与制冷技术的核心。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "林德循环",
        "description": "工业气体液化技术"
      },
      {
        "title": "转换温度",
        "description": "制冷与制热的分界"
      }
    ]
  },
  {
    "slug": "photoelectric",
    "title": "光电效应",
    "subtitle": "从经典困惑到光量子假说",
    "category": "近代物理",
    "difficulty": "advanced",
    "targetAge": "高中至大学",
    "sourcePath": "/photoelectric",
    "sourceChunk": "PhotoelectricExperiment-CKmqZ4Q6.js",
    "objectives": [
      "理解光电效应的基本现象与规律",
      "掌握爱因斯坦光电方程",
      "认识光的量子性"
    ],
    "prerequisites": [
      "光的波动性",
      "功和能"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到光电效应实验！这是揭开量子世界大门的关键实验之一。"
          },
          {
            "text": "当光照射到金属表面，会有电子飞出，这种现象叫做光电效应。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "经典的困惑",
        "lines": [
          {
            "text": "按照经典波动理论，只要光足够强，迟早能把电子打出来。"
          },
          {
            "text": "但实验发现：频率低于某个截止频率时，无论光多强，都没有电子逸出。"
          },
          {
            "text": "而频率足够高时，哪怕光很弱，也会立刻有电子飞出。这让经典物理无法解释。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "爱因斯坦的解释",
        "lines": [
          {
            "text": "爱因斯坦提出：光是一份份的光量子，每个光子能量等于 h 乘以频率。",
            "formula": "E = h\\nu"
          },
          {
            "text": "电子逸出需要克服逸出功 W，剩下的能量变为动能。",
            "formula": "E_k = h\\nu - W"
          },
          {
            "text": "只有当频率大于截止频率 ν₀ 时才会发生光电效应。",
            "formula": "\\nu_0 = \\frac{W}{h}"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "动手探索",
        "lines": [
          {
            "text": "试着提高光强，你会发现逸出电子更多，但它们的最大动能不变。"
          },
          {
            "text": "再提高频率，电子的最大初动能随之增大，遏止电压也变大。"
          },
          {
            "text": "换一种逸出功更大的金属，需要更高的频率才能让电子逸出。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "光电效应是光电倍增管、光电传感器和太阳能电池的物理基础。"
          },
          {
            "text": "爱因斯坦因解释光电效应而获得诺贝尔物理学奖。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "光电效应揭示了光的粒子性：光以光子为单位与电子作用。"
          },
          {
            "text": "记住核心方程：最大初动能等于光子能量减去逸出功。"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "康普顿效应",
        "description": "进一步验证光的粒子性"
      },
      {
        "title": "波粒二象性",
        "description": "光既是波也是粒子"
      }
    ]
  },
  {
    "slug": "bohr-model",
    "title": "玻尔氢原子模型",
    "subtitle": "量子化轨道与光谱之谜",
    "category": "近代物理",
    "difficulty": "advanced",
    "targetAge": "高中至大学",
    "sourcePath": "/bohr-model",
    "sourceChunk": "BohrModelExperiment-Ck_aaP1D.js",
    "objectives": [
      "理解玻尔的能级量子化假设",
      "掌握电子跃迁与光谱线的对应关系",
      "认识里德伯公式"
    ],
    "prerequisites": [
      "原子结构",
      "光的量子性"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到玻尔氢原子实验！我们将在三维空间中看清原子内部的电子轨道。"
          },
          {
            "text": "十九世纪人们发现氢气发出的光只有几条特定颜色的谱线，这曾是个巨大的谜。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "玻尔的假设",
        "lines": [
          {
            "text": "玻尔提出：电子只能在一些特定的轨道上运动，每条轨道对应一个确定的能量。"
          },
          {
            "text": "轨道半径与量子数 n 的平方成正比，n 越大轨道越远、能量越高。"
          },
          {
            "text": "电子在轨道上运动时不辐射能量，这就是能级量子化。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "能级与光谱",
        "lines": [
          {
            "text": "氢原子第 n 能级的能量等于负的 13.6 除以 n 的平方电子伏特。",
            "formula": "E_n = -\\frac{13.6}{n^2}\\,\\text{eV}"
          },
          {
            "text": "电子从高能级跳到低能级时，释放一个光子，能量等于两能级之差。",
            "formula": "h\\nu = E_i - E_f"
          },
          {
            "text": "谱线波长由里德伯公式决定。",
            "formula": "\\frac{1}{\\lambda} = R\\left(\\frac{1}{n_f^2}-\\frac{1}{n_i^2}\\right)"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "动手探索",
        "lines": [
          {
            "text": "点击右侧能级图，让电子在不同轨道间跃迁。"
          },
          {
            "text": "当电子跳到 n 等于 2 的轨道时，发出的就是可见的巴尔末系谱线。"
          },
          {
            "text": "跳到 n 等于 1 时释放紫外的莱曼系，跳到 n 等于 3 则是红外的帕邢系。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "原子光谱是天文学测定恒星成分的指纹。"
          },
          {
            "text": "玻尔模型虽被量子力学取代，但它第一次成功解释了氢光谱。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "玻尔模型的核心是能级量子化与跃迁辐射。"
          },
          {
            "text": "每一条谱线，都对应电子在两个确定能级之间的一次跳跃。"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "量子力学的电子云",
        "description": "超越玻尔轨道的现代图像"
      },
      {
        "title": "氢原子光谱系",
        "description": "莱曼、巴尔末、帕邢系详解"
      }
    ]
  },
  {
    "slug": "radioactive-decay",
    "title": "放射性衰变",
    "subtitle": "随机中的确定：半衰期与指数律",
    "category": "近代物理",
    "difficulty": "intermediate",
    "targetAge": "高中至大学",
    "sourcePath": "/radioactive-decay",
    "sourceChunk": "RadioactiveDecayExperiment-Be77RpuZ.js",
    "objectives": [
      "理解放射性衰变的随机性与统计规律",
      "掌握半衰期与衰变定律",
      "认识大数定律在物理中的体现"
    ],
    "prerequisites": [
      "原子核结构",
      "指数函数"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到放射性衰变实验！这里藏着一个迷人的矛盾：随机却又确定。"
          },
          {
            "text": "屏幕上每个蓝点代表一个不稳定的原子核，它们会随机变成灰色，表示发生了衰变。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "随机与统计",
        "lines": [
          {
            "text": "我们无法预测任何一个核什么时候衰变，这是纯粹的随机事件。"
          },
          {
            "text": "但当核的数量足够多，整体衰变就呈现出非常确定的指数规律。"
          },
          {
            "text": "每经过一个半衰期，剩余的核数就减少一半。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "衰变定律",
        "lines": [
          {
            "text": "剩余核数随时间按指数规律减少。",
            "formula": "N = N_0 e^{-\\lambda t}"
          },
          {
            "text": "半衰期等于 ln2 除以衰变常数。",
            "formula": "T_{1/2} = \\frac{\\ln 2}{\\lambda}"
          },
          {
            "text": "平均寿命是衰变常数的倒数。",
            "formula": "\\tau = \\frac{1}{\\lambda}"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "动手探索",
        "lines": [
          {
            "text": "点击开始，观察蓝色散点如何紧贴橙色的理论曲线。"
          },
          {
            "text": "注意到接近末尾时，少量核的衰变会出现明显的统计涨落。"
          },
          {
            "text": "调整半衰期，曲线下降的快慢随之改变。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "碳14测年法利用半衰期推断文物和化石的年代。"
          },
          {
            "text": "放射性同位素还广泛用于医学诊断与治疗。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "单个核的衰变是随机的，群体的衰变是确定的。"
          },
          {
            "text": "这正是大数定律在微观世界的精彩体现。"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "碳14测年",
        "description": "放射性测年的原理与应用"
      },
      {
        "title": "衰变链",
        "description": "多级衰变与放射性平衡"
      }
    ]
  },
  {
    "slug": "wave-particle-duality",
    "title": "波粒二象性",
    "subtitle": "单光子双缝：粒子如何画出波的条纹",
    "category": "近代物理",
    "difficulty": "advanced",
    "targetAge": "高中至大学",
    "sourcePath": "/wave-particle-duality",
    "sourceChunk": "WaveParticleDualityExperiment-WThAjSpX.js",
    "objectives": [
      "理解光与微观粒子的波粒二象性",
      "认识单光子双缝干涉实验的意义",
      "了解德布罗意物质波"
    ],
    "prerequisites": [
      "双缝干涉",
      "光子概念"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到波粒二象性实验！这是量子力学中最深刻、最反直觉的实验。"
          },
          {
            "text": "我们让光子一个一个地穿过双缝，看它们如何打在屏上。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "令人困惑的现象",
        "lines": [
          {
            "text": "每个光子打在屏上都是一个确定的点，表现出粒子性。"
          },
          {
            "text": "但随着光子越来越多，这些看似随机的点竟然累积出明暗相间的干涉条纹。"
          },
          {
            "text": "这说明每个光子都以波的形式同时通过两条缝，并与自己发生干涉。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "物质波",
        "lines": [
          {
            "text": "德布罗意提出，任何粒子都伴随一个波，波长等于普朗克常数除以动量。",
            "formula": "\\lambda = \\frac{h}{p}"
          },
          {
            "text": "干涉条纹间距与波长、缝屏距离成正比，与缝间距成反比。",
            "formula": "\\Delta y = \\frac{\\lambda L}{d}"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "动手探索",
        "lines": [
          {
            "text": "一开始屏上只是零星散点，看不出规律。"
          },
          {
            "text": "耐心等待，条纹会逐渐浮现，并紧贴右侧粉色的理论强度曲线。"
          },
          {
            "text": "增大缝间距，条纹会变密；改变缝宽会改变整体的衍射包络。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "电子的波动性被用于电子显微镜，分辨率远超光学显微镜。"
          },
          {
            "text": "波粒二象性是整个量子力学的基石。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "光子是粒子，也是波；这两种图像在量子世界中和谐统一。"
          },
          {
            "text": "单光子干涉告诉我们：概率波支配着微观世界。"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "不确定性原理",
        "description": "位置与动量不可同时精确"
      },
      {
        "title": "电子双缝实验",
        "description": "物质波的直接证据"
      }
    ]
  },
  {
    "slug": "compton-scattering",
    "title": "康普顿散射",
    "subtitle": "光子像粒子一样与电子碰撞",
    "category": "近代物理",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/compton-scattering",
    "sourceChunk": "ComptonScatteringExperiment-Dkxss4ZX.js",
    "objectives": [
      "理解康普顿散射的光子粒子性",
      "掌握康普顿位移公式",
      "认识波长移动与散射角的关系"
    ],
    "prerequisites": [
      "光子能量",
      "动量守恒",
      "波粒二象性"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到康普顿散射实验！1923 年，康普顿用 X 射线照射石墨，有了惊人发现。"
          },
          {
            "text": "散射后的 X 射线，波长竟然变长了，而且变长的多少只与散射角有关。"
          },
          {
            "text": "经典波动理论无法解释，但如果把光当作粒子，一切就迎刃而解。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "康普顿把 X 射线光子看作携带能量和动量的粒子。"
          },
          {
            "text": "光子与电子发生弹性碰撞，就像两个台球相撞。"
          },
          {
            "text": "光子把一部分能量和动量传给电子，自己的能量减小。"
          },
          {
            "text": "能量减小意味着频率降低、波长变长，这就是康普顿位移。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "康普顿位移公式给出波长的增加量。",
            "formula": "\\Delta\\lambda = \\frac{h}{m_e c}(1 - \\cos\\theta)"
          },
          {
            "text": "其中 h 比 m_e c 称为康普顿波长，约等于 2.43 皮米。",
            "formula": "\\lambda_C = \\frac{h}{m_e c} \\approx 2.43\\,\\text{pm}"
          },
          {
            "text": "散射角 θ 越大，波长增加越多；散射角为零时波长不变。"
          },
          {
            "text": "当散射角为 180 度时，波长增加达到最大，等于两倍康普顿波长。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调整散射角，观察散射光子的波长如何随之增加。"
          },
          {
            "text": "同时注意反冲电子飞出的方向，它带走了光子失去的动量。"
          },
          {
            "text": "改变入射光子的波长，看康普顿位移占比的变化。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "康普顿散射是确认光子粒子性的关键实验，让康普顿获得诺贝尔奖。"
          },
          {
            "text": "它在伽马射线探测和医学影像中有重要应用。"
          },
          {
            "text": "天体物理中，康普顿散射帮助我们理解高能宇宙射线。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "康普顿散射是光子与电子的弹性碰撞，散射光波长变长。"
          },
          {
            "text": "波长增量等于康普顿波长乘以括号一减 cosθ。"
          },
          {
            "text": "这个实验有力证明了光的粒子性。希望你已理解光子如何像粒子般碰撞！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "康普顿的诺贝尔奖",
        "description": "散射实验如何证实光子动量"
      },
      {
        "title": "光子的能量与动量",
        "description": "E=hν 与 p=h/λ 的关系"
      }
    ]
  },
  {
    "slug": "de-broglie",
    "title": "德布罗意物质波",
    "subtitle": "一切运动的物质都伴随着波",
    "category": "近代物理",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/de-broglie",
    "sourceChunk": "DeBroglieExperiment-BxMISt-1.js",
    "objectives": [
      "理解物质波的概念与德布罗意假说",
      "掌握 λ = h/p 物质波波长公式",
      "认识电子衍射对物质波的验证"
    ],
    "prerequisites": [
      "动量",
      "光的波粒二象性",
      "普朗克常量"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到德布罗意物质波实验！光既是波又是粒子，那么电子这样的粒子，会不会也是波呢？"
          },
          {
            "text": "1924 年，年轻的德布罗意大胆假设：一切运动的物质都伴随着波。"
          },
          {
            "text": "这个看似疯狂的想法，后来被电子衍射实验完美证实，开启了量子力学的大门。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "德布罗意认为，任何有动量的粒子都对应一个波，称为物质波。"
          },
          {
            "text": "粒子的动量越大，对应的物质波波长就越短。"
          },
          {
            "text": "对于宏观物体，波长极其微小，无法观测，所以我们感觉不到它的波动性。"
          },
          {
            "text": "但对于电子这样的微观粒子，波长可以和原子间距相当，于是衍射现象就显现出来。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "德布罗意波长等于普朗克常量除以粒子的动量。",
            "formula": "\\lambda = \\frac{h}{p} = \\frac{h}{mv}"
          },
          {
            "text": "对于经电压 U 加速的电子，波长可以用一个简洁公式估算。",
            "formula": "\\lambda \\approx \\frac{1.226}{\\sqrt{U}}\\,\\text{nm}"
          },
          {
            "text": "其中 U 以伏特为单位，加速电压越高，电子波长越短。"
          },
          {
            "text": "一百伏特加速的电子，波长约 0.12 纳米，正好适合探测晶体结构。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调整加速电压，观察电子物质波波长如何变化。"
          },
          {
            "text": "电压越高，电子动量越大，波长越短，波纹变得更密。"
          },
          {
            "text": "对比电子与宏观物体的波长，感受为什么我们日常察觉不到物质波。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "电子显微镜利用电子的短波长，分辨率远超光学显微镜。"
          },
          {
            "text": "电子衍射和中子衍射，是研究晶体和分子结构的重要手段。"
          },
          {
            "text": "物质波概念是整个量子力学的基石之一。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "德布罗意提出一切运动物质都伴随物质波，波长等于 h 除以动量。"
          },
          {
            "text": "动量越大波长越短，微观粒子的波动性可通过衍射观测。"
          },
          {
            "text": "从假说到电子显微镜，物质波深刻改变了我们对世界的认识。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "戴维孙-革末实验",
        "description": "电子衍射如何验证物质波"
      },
      {
        "title": "电子显微镜",
        "description": "利用电子短波长实现高分辨成像"
      }
    ]
  },
  {
    "slug": "mass-energy",
    "title": "质能方程与核结合能",
    "subtitle": "E=mc² 与原子核的能量之源",
    "category": "近代物理",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/mass-energy",
    "sourceChunk": "MassEnergyExperiment-BiySc8BW.js",
    "objectives": [
      "理解质能等价关系 E=mc²",
      "掌握质量亏损与核结合能",
      "认识比结合能曲线与核能释放"
    ],
    "prerequisites": [
      "原子核结构",
      "能量守恒",
      "相对论初步"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到质能方程实验！E 等于 m c 平方，也许是物理学中最著名的公式。"
          },
          {
            "text": "它告诉我们，质量和能量本质上是同一事物的两面，可以相互转化。"
          },
          {
            "text": "正是这个原理，揭示了原子核中蕴藏的惊人能量。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "把质子和中子组合成原子核，总质量竟然比它们单独时的质量之和要小。"
          },
          {
            "text": "这减少的质量叫做质量亏损，它并没有消失，而是转化成了能量。"
          },
          {
            "text": "这份能量就是核结合能，把核子紧紧束缚在一起。"
          },
          {
            "text": "把结合能除以核子数，得到比结合能，它衡量原子核的稳定程度。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "质能方程指出能量等于质量乘以光速的平方。",
            "formula": "E = mc^2"
          },
          {
            "text": "核结合能等于质量亏损乘以光速平方。",
            "formula": "E_b = \\Delta m\\, c^2"
          },
          {
            "text": "比结合能曲线在铁元素附近达到最高峰，约每核子 8.8 兆电子伏。"
          },
          {
            "text": "轻核聚变成中等核、或重核裂变成中等核，都会向更稳定状态释放能量。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "在比结合能曲线上拖动，选择不同的原子核，查看它的比结合能。"
          },
          {
            "text": "注意曲线在铁元素附近最高，那里的原子核最稳定。"
          },
          {
            "text": "左侧轻核走向铁是聚变放能，右侧重核走向铁是裂变放能。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "核电站利用铀核裂变释放的能量发电。"
          },
          {
            "text": "太阳和恒星靠氢核聚变成氦，持续发光发热。"
          },
          {
            "text": "质能方程也是粒子物理和宇宙学的基础。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "质能方程 E 等于 m c 平方，揭示质量与能量可相互转化。"
          },
          {
            "text": "核结合能来自质量亏损，比结合能曲线在铁附近最高。"
          },
          {
            "text": "聚变与裂变都向铁靠拢释放能量。这就是核能的奥秘。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "核裂变与核聚变",
        "description": "为何两者都能释放巨大能量"
      },
      {
        "title": "恒星的能量来源",
        "description": "聚变如何点亮太阳"
      }
    ]
  },
  {
    "slug": "quantum-tunneling",
    "title": "量子隧穿",
    "subtitle": "粒子穿越经典禁区的奇迹",
    "category": "近代物理",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/quantum-tunneling",
    "sourceChunk": "QuantumTunnelingExperiment-CcoFgVBs.js",
    "objectives": [
      "理解量子隧穿现象",
      "掌握透射系数与势垒的关系",
      "认识隧穿的实际应用"
    ],
    "prerequisites": [
      "波函数",
      "德布罗意物质波",
      "势垒"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到量子隧穿实验！想象一个球滚向一座小山，能量不够就会退回来。"
          },
          {
            "text": "但在量子世界里，微观粒子竟能穿过它本不该越过的势垒。"
          },
          {
            "text": "这种违反经典直觉的现象，就是量子隧穿。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "量子粒子由波函数描述，它在势垒内部并不会突然变为零。"
          },
          {
            "text": "波函数在势垒中以指数形式衰减，但仍有一部分渗透到另一侧。"
          },
          {
            "text": "于是粒子有一定概率出现在势垒另一边，仿佛穿墙而过。"
          },
          {
            "text": "这种概率叫做透射系数，势垒越厚越高，透射概率越小。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "当能量低于势垒高度时，透射系数近似按指数衰减。",
            "formula": "T \\approx e^{-2\\kappa a}"
          },
          {
            "text": "衰减系数 κ 由粒子质量和势垒高度决定。",
            "formula": "\\kappa = \\frac{\\sqrt{2m(V_0 - E)}}{\\hbar}"
          },
          {
            "text": "其中 a 是势垒宽度，V₀ 是势垒高度，E 是粒子能量。"
          },
          {
            "text": "势垒每加宽一点，透射概率就成倍下降，因此隧穿对宽度极其敏感。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "观察波函数在势垒中指数衰减、在另一侧继续传播。"
          },
          {
            "text": "增大势垒宽度，透射系数急剧减小。"
          },
          {
            "text": "提高粒子能量靠近势垒高度，透射概率明显上升。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "扫描隧道显微镜利用隧穿电流，能分辨单个原子。"
          },
          {
            "text": "恒星内部靠隧穿，使质子在不够高的温度下也能聚变。"
          },
          {
            "text": "隧道二极管和闪存芯片，也都依赖量子隧穿。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "量子隧穿让粒子能穿过经典上无法逾越的势垒。"
          },
          {
            "text": "透射系数 T 约等于 e 的负 2κa 次方，对势垒宽度极其敏感。"
          },
          {
            "text": "从显微镜到恒星聚变，隧穿是量子世界的奇迹。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "扫描隧道显微镜",
        "description": "利用隧穿电流看见原子"
      },
      {
        "title": "核聚变与隧穿",
        "description": "恒星为何能在低温下聚变"
      }
    ]
  },
  {
    "slug": "atomic-spectra",
    "title": "原子能级与光谱",
    "subtitle": "能级跃迁产生的特征谱线",
    "category": "近代物理",
    "difficulty": "advanced",
    "targetAge": "16-18岁",
    "sourcePath": "/atomic-spectra",
    "sourceChunk": "AtomicSpectraExperiment-De2zP7Sc.js",
    "objectives": [
      "理解原子能级的量子化",
      "掌握里德伯公式",
      "认识发射光谱与吸收光谱"
    ],
    "prerequisites": [
      "玻尔模型",
      "光子能量",
      "能级跃迁"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到原子能级与光谱实验！每种元素被点燃时，都会发出特定颜色的光。"
          },
          {
            "text": "钠灯是黄色，氖灯是红色，这些独特的颜色就像元素的指纹。"
          },
          {
            "text": "今天我们就来理解，原子的能级如何决定它发出的光谱。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "原子中的电子只能处于一系列分立的能级，不能取中间值。"
          },
          {
            "text": "电子从高能级跃迁到低能级时，放出一个光子，形成发射谱线。"
          },
          {
            "text": "电子吸收光子从低能级跃迁到高能级，形成吸收谱线。"
          },
          {
            "text": "光子的能量恰好等于两个能级的能量差，决定了谱线的波长。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "光子能量等于跃迁前后的能级差。",
            "formula": "h\\nu = E_{高} - E_{低}"
          },
          {
            "text": "对氢原子，谱线波长由里德伯公式给出。",
            "formula": "\\frac{1}{\\lambda} = R\\left(\\frac{1}{n_1^2} - \\frac{1}{n_2^2}\\right)"
          },
          {
            "text": "其中 R 是里德伯常量，n₁、n₂ 是能级的主量子数。"
          },
          {
            "text": "跃迁到 n₁=2 的谱线落在可见光区，称为巴尔末系。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "选择不同的能级跃迁，观察发射谱线的位置和颜色。"
          },
          {
            "text": "跃迁的能级差越大，光子能量越高，波长越短，偏向蓝紫。"
          },
          {
            "text": "注意巴尔末系的几条可见谱线，它们正是氢光谱的标志。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "天文学家通过恒星光谱，识别遥远天体的化学成分。"
          },
          {
            "text": "光谱分析是化学元素鉴定的强大工具。"
          },
          {
            "text": "霓虹灯、激光器的工作原理都与原子能级跃迁有关。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "原子能级是量子化的，跃迁时吸收或放出特定能量的光子。"
          },
          {
            "text": "氢原子谱线由里德伯公式描述，巴尔末系落在可见光区。"
          },
          {
            "text": "光谱是元素的指纹，连接微观原子与浩瀚星空。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "光谱分析",
        "description": "从谱线识别元素成分"
      },
      {
        "title": "巴尔末系",
        "description": "氢原子可见光谱线"
      }
    ]
  },
  {
    "slug": "franck-hertz",
    "title": "弗兰克-赫兹实验",
    "subtitle": "证实原子能级量子化的经典实验",
    "category": "近代物理",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/franck-hertz",
    "sourceChunk": "FranckHertzExperiment-KrTr42cw.js",
    "objectives": [
      "理解电子与原子的非弹性碰撞",
      "认识阳极电流的周期性下降",
      "理解原子能级量子化的实验证据"
    ],
    "prerequisites": [
      "原子能级",
      "电子加速",
      "能量交换"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到弗兰克-赫兹实验！1914 年，这个实验第一次直接证明了原子能级的量子化。"
          },
          {
            "text": "它让加速的电子去撞击汞原子，记录通过的电流。"
          },
          {
            "text": "电流随电压变化的奇特规律，揭示了原子内部的能量秘密。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "电子在电场中被加速，获得能量后去碰撞汞原子。"
          },
          {
            "text": "当电子能量不足时，碰撞是弹性的，电子几乎不损失能量，顺利到达阳极。"
          },
          {
            "text": "当电子能量达到汞原子的激发能时，碰撞变为非弹性，电子把能量交给原子。"
          },
          {
            "text": "失去能量的电子无法克服减速电压，于是阳极电流骤然下降。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "电流随加速电压上升，但每隔一个固定间隔就骤降一次。"
          },
          {
            "text": "这个间隔恰好等于汞原子的激发能，约 4.9 电子伏。",
            "formula": "\\Delta U \\approx 4.9\\,\\text{V}"
          },
          {
            "text": "电子每积累到 4.9 电子伏，就会通过非弹性碰撞把能量交给原子。"
          },
          {
            "text": "电流谷值等间距出现，正是原子能级量子化的直接证据。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "增大加速电压，观察阳极电流的整体上升趋势。"
          },
          {
            "text": "注意电流曲线上等间距出现的一系列波谷。"
          },
          {
            "text": "相邻波谷间隔约 4.9 伏，对应汞原子的激发能。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "弗兰克-赫兹实验为玻尔的原子模型提供了关键的实验支持。"
          },
          {
            "text": "两位科学家因此获得了 1925 年的诺贝尔物理学奖。"
          },
          {
            "text": "它至今仍是大学物理实验中验证量子化的经典内容。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "电子与汞原子的非弹性碰撞导致阳极电流周期性下降。"
          },
          {
            "text": "相邻电流谷的电压间隔约 4.9 伏，等于汞原子激发能。"
          },
          {
            "text": "这个实验直接证实了原子能级的量子化。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "玻尔模型的验证",
        "description": "弗兰克-赫兹与玻尔理论"
      },
      {
        "title": "汞原子激发能",
        "description": "4.9 电子伏的来历"
      }
    ]
  },
  {
    "slug": "ohms-law",
    "title": "欧姆定律与串并联",
    "subtitle": "电压、电流、电阻的基本关系",
    "category": "电路电子",
    "difficulty": "beginner",
    "targetAge": "初中至高中",
    "sourcePath": "/ohms-law",
    "sourceChunk": "OhmsLawExperiment-D7gJTcOi.js",
    "objectives": [
      "掌握欧姆定律",
      "理解串联分压与并联分流",
      "会计算等效电阻"
    ],
    "prerequisites": [
      "电流与电压",
      "电阻"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到欧姆定律实验！这是电路分析最基础也最重要的规律。"
          },
          {
            "text": "蓝色的小点代表流动的电流，黄色符号是电源。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "欧姆定律告诉我们：导体两端电压等于电流乘以电阻。"
          },
          {
            "text": "串联电路中，电流处处相等，电压按电阻大小分配。"
          },
          {
            "text": "并联电路中，各支路电压相同，电流按电阻成反比分配。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "欧姆定律的核心公式。",
            "formula": "U = IR"
          },
          {
            "text": "串联等效电阻等于各电阻之和。",
            "formula": "R_s = R_1 + R_2 + \\cdots"
          },
          {
            "text": "并联等效电阻的倒数等于各电阻倒数之和。",
            "formula": "\\frac{1}{R_p} = \\frac{1}{R_1} + \\frac{1}{R_2} + \\cdots"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "动手探索",
        "lines": [
          {
            "text": "在串联模式下增大某个电阻，它分到的电压随之增大。"
          },
          {
            "text": "切换到并联，观察总电流如何大于任何一条支路的电流。"
          },
          {
            "text": "提高电源电压，电流和功率都会增大。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "家庭电器都采用并联，保证每个电器都获得相同的电压。"
          },
          {
            "text": "串联分压常用于电位器和分压电路。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "欧姆定律 U 等于 I 乘以 R，是电路分析的基石。"
          },
          {
            "text": "串联分压、并联分流，记住这两条规律就能分析简单电路。"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "基尔霍夫定律",
        "description": "复杂电路的节点与回路分析"
      },
      {
        "title": "电功率",
        "description": "电路中能量的转化"
      }
    ]
  },
  {
    "slug": "rlc-resonance",
    "title": "RLC 谐振电路",
    "subtitle": "电谐振、品质因数与频率选择",
    "category": "电路电子",
    "difficulty": "advanced",
    "targetAge": "大学本科",
    "sourcePath": "/rlc-resonance",
    "sourceChunk": "RLCResonanceExperiment-6N_6NwOQ.js",
    "objectives": [
      "理解 RLC 串联电路的谐振现象",
      "掌握谐振频率与品质因数",
      "认识频率响应曲线"
    ],
    "prerequisites": [
      "交流电",
      "电感与电容",
      "阻抗"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到 RLC 谐振实验！谐振是收音机选台、无线通信的物理基础。"
          },
          {
            "text": "左边是电压和电流波形，右边是电流随频率变化的响应曲线。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "什么是谐振",
        "lines": [
          {
            "text": "电感的感抗随频率升高而增大，电容的容抗随频率升高而减小。"
          },
          {
            "text": "在某个特定频率，感抗和容抗大小相等、互相抵消，这就是谐振。"
          },
          {
            "text": "此时电路阻抗最小，电流达到最大值。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "谐振频率由电感和电容决定。",
            "formula": "f_0 = \\frac{1}{2\\pi\\sqrt{LC}}"
          },
          {
            "text": "品质因数衡量谐振的尖锐程度。",
            "formula": "Q = \\frac{1}{R}\\sqrt{\\frac{L}{C}}"
          },
          {
            "text": "电流幅值等于驱动电压除以阻抗模。",
            "formula": "I_0 = \\frac{U_0}{\\sqrt{R^2 + (\\omega L - 1/\\omega C)^2}}"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "动手探索",
        "lines": [
          {
            "text": "点击“调到谐振频率”，黄点会移到曲线顶峰，电流达到最大。"
          },
          {
            "text": "在谐振点，电压和电流同相，相位差为零。"
          },
          {
            "text": "减小电阻，品质因数增大，谐振峰变得更尖锐。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "收音机正是通过调节谐振频率来选择某个电台。"
          },
          {
            "text": "谐振电路还广泛用于滤波器、振荡器和无线充电。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "谐振时感抗容抗抵消，阻抗最小、电流最大。"
          },
          {
            "text": "Q 值决定了电路对频率的选择性，是设计的关键指标。"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "带通滤波器",
        "description": "利用谐振选择频带"
      },
      {
        "title": "LC 振荡器",
        "description": "产生特定频率的振荡"
      }
    ]
  },
  {
    "slug": "kirchhoff",
    "title": "基尔霍夫定律",
    "subtitle": "复杂电路的通用分析法",
    "category": "电路电子",
    "difficulty": "advanced",
    "targetAge": "高中至大学",
    "sourcePath": "/kirchhoff",
    "sourceChunk": "KirchhoffExperiment-BaGJAHH_.js",
    "objectives": [
      "理解节点电流定律",
      "理解回路电压定律",
      "会分析多回路电路"
    ],
    "prerequisites": [
      "欧姆定律",
      "串并联电路"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到基尔霍夫定律实验！当电路有多个电源和多条回路时，串并联已经不够用了。"
          },
          {
            "text": "基尔霍夫的两条定律，能解决任意复杂的电路。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "两条定律",
        "lines": [
          {
            "text": "节点电流定律说：流入任一节点的电流之和，等于流出的电流之和。这是电荷守恒。"
          },
          {
            "text": "回路电压定律说：沿任一闭合回路，电动势之和等于电压降之和。这是能量守恒。"
          },
          {
            "text": "把这两条定律列成方程组，就能解出每条支路的电流。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "节点电流定律。",
            "formula": "\\sum I_{in} = \\sum I_{out}"
          },
          {
            "text": "回路电压定律。",
            "formula": "\\sum \\mathcal{E} = \\sum IR"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "动手探索",
        "lines": [
          {
            "text": "调节两个电源电压，观察中间支路电流的方向变化。"
          },
          {
            "text": "当某条电流变成红色，说明它的实际方向与假设相反。"
          },
          {
            "text": "随时验证：I₁ 始终等于 I₂ 加 I₃，节点电流守恒。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "基尔霍夫定律是电路仿真软件求解电路的核心算法。"
          },
          {
            "text": "从手机电路到电网分析，都离不开它。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "节点用电流定律，回路用电压定律，列方程组求解。"
          },
          {
            "text": "本质上是电荷守恒与能量守恒在电路中的体现。"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "戴维南定理",
        "description": "复杂电路的等效简化"
      },
      {
        "title": "网孔分析法",
        "description": "系统化的回路分析"
      }
    ]
  },
  {
    "slug": "diode",
    "title": "半导体二极管",
    "subtitle": "PN 结的单向导电与伏安特性",
    "category": "电路电子",
    "difficulty": "intermediate",
    "targetAge": "16-18岁",
    "sourcePath": "/diode",
    "sourceChunk": "DiodeExperiment-l5Jc7G-C.js",
    "objectives": [
      "理解 PN 结的单向导电性",
      "掌握二极管的伏安特性曲线",
      "认识肖克利方程与导通电压"
    ],
    "prerequisites": [
      "电流与电压",
      "半导体基础",
      "指数函数"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到半导体二极管实验！二极管是现代电子设备中最基础的元件之一。"
          },
          {
            "text": "它最神奇的特性，是只允许电流朝一个方向流动，像一个电的单行道。"
          },
          {
            "text": "今天我们就来描绘它的伏安特性曲线，理解这种单向导电的奥秘。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "二极管的核心是一个 PN 结，由 P 型和 N 型半导体接触而成。"
          },
          {
            "text": "正向偏置时，加正电压，超过导通电压后电流迅速增大。"
          },
          {
            "text": "反向偏置时，几乎没有电流通过，二极管处于截止状态。"
          },
          {
            "text": "硅二极管的导通电压约 0.7 伏，锗二极管约 0.3 伏。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "二极管电流与电压的关系由肖克利方程描述。",
            "formula": "I = I_s\\left(e^{V/(nV_T)} - 1\\right)"
          },
          {
            "text": "其中 I_s 是反向饱和电流，V_T 是热电压，室温下约 26 毫伏。"
          },
          {
            "text": "由于指数关系，正向电压稍稍增加，电流就急剧上升。"
          },
          {
            "text": "反向时指数项趋近于零，电流约等于负的反向饱和电流，非常微小。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "拖动电压滑块，观察伏安特性曲线上工作点的移动。"
          },
          {
            "text": "正向超过导通电压后，电流呈指数式陡增。"
          },
          {
            "text": "调整理想因子 n，看曲线的陡峭程度如何变化。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "二极管最常见的用途是整流，把交流电变成直流电。"
          },
          {
            "text": "发光二极管 LED 在正向导通时发光，广泛用于照明和显示。"
          },
          {
            "text": "稳压二极管利用反向击穿特性，提供稳定的参考电压。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "二极管的核心是 PN 结，具有单向导电性。"
          },
          {
            "text": "伏安特性由肖克利方程描述，正向指数式导通，反向几乎截止。"
          },
          {
            "text": "从整流到 LED，二极管是电子世界的基石。希望你已理解它的单向魔法！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "整流电路",
        "description": "二极管如何把交流变直流"
      },
      {
        "title": "发光二极管 LED",
        "description": "PN 结发光的原理"
      }
    ]
  },
  {
    "slug": "transistor-amplifier",
    "title": "三极管放大器",
    "subtitle": "用小电流控制大电流的电子开关与放大",
    "category": "电路电子",
    "difficulty": "advanced",
    "targetAge": "16-18岁",
    "sourcePath": "/transistor-amplifier",
    "sourceChunk": "TransistorAmplifierExperiment-B0Wtur2w.js",
    "objectives": [
      "理解三极管的电流放大作用",
      "掌握共射放大电路的电压放大倍数",
      "认识小信号放大与波形反相"
    ],
    "prerequisites": [
      "二极管",
      "欧姆定律",
      "PN 结"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到三极管放大器实验！三极管被誉为二十世纪最重要的发明之一。"
          },
          {
            "text": "它能用一个微弱的信号，去控制一个强得多的电流，这就是放大。"
          },
          {
            "text": "从收音机到计算机，整个电子时代都建立在三极管的放大与开关之上。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "三极管有三个电极：基极、集电极和发射极。"
          },
          {
            "text": "基极上微小的电流变化，能引起集电极上很大的电流变化。"
          },
          {
            "text": "集电极电流是基极电流的 β 倍，β 是电流放大系数，常达上百。"
          },
          {
            "text": "把这个电流变化转换成电压变化，就实现了信号的电压放大。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "集电极电流等于电流放大系数乘以基极电流。",
            "formula": "I_C = \\beta I_B"
          },
          {
            "text": "共射放大电路的电压放大倍数，约等于负 β 乘以集电极电阻除以输入电阻。",
            "formula": "A_v = -\\frac{\\beta R_C}{r_{be}}"
          },
          {
            "text": "负号表示输出电压与输入电压反相，相位差 180 度。"
          },
          {
            "text": "放大倍数越大，微弱信号被放大得越强，但要注意避免失真。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "观察输入小信号和放大后的输出信号，注意输出幅度大得多。"
          },
          {
            "text": "注意输出波形与输入反相，这是共射放大电路的特征。"
          },
          {
            "text": "调整放大系数 β 和集电极电阻，看放大倍数如何变化。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "音频放大器用三极管把微弱的麦克风信号放大，驱动扬声器。"
          },
          {
            "text": "三极管作为开关，是数字电路和计算机的基础。"
          },
          {
            "text": "现代芯片上集成了数十亿个晶体管，构成强大的处理器。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "三极管用小的基极电流控制大的集电极电流，Ic 等于 β 乘以 Ib。"
          },
          {
            "text": "共射放大电路把信号电压放大，输出与输入反相。"
          },
          {
            "text": "从放大到开关，三极管开创了电子时代。希望你已理解它的放大魔力！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "场效应管 MOSFET",
        "description": "现代芯片的核心开关元件"
      },
      {
        "title": "运算放大器",
        "description": "由晶体管构成的通用放大模块"
      }
    ]
  },
  {
    "slug": "lc-oscillation",
    "title": "LC 振荡电路",
    "subtitle": "电能与磁能的周期性转换",
    "category": "电路电子",
    "difficulty": "intermediate",
    "targetAge": "16-18岁",
    "sourcePath": "/lc-oscillation",
    "sourceChunk": "LCOscillationExperiment-B8fddjj7.js",
    "objectives": [
      "理解 LC 回路的电磁振荡",
      "掌握振荡频率公式",
      "认识电场能与磁场能的转换"
    ],
    "prerequisites": [
      "电容",
      "电感",
      "简谐振动"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到 LC 振荡电路实验！把一个充了电的电容接到一个电感上，会发生什么？"
          },
          {
            "text": "电流会在电路中来回振荡，能量在电容和电感之间不断传递。"
          },
          {
            "text": "这种电磁振荡是无线电技术的基础，也与机械振动有着优美的对应关系。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "电容储存电场能，电感储存磁场能。"
          },
          {
            "text": "电容放电时电流增大，能量从电场转移到电感的磁场。"
          },
          {
            "text": "电流到最大后，电感又给电容反向充电，磁场能回到电场。"
          },
          {
            "text": "这一过程周而复始，形成持续的电磁振荡，总能量保持守恒。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "LC 回路的振荡频率由电感和电容共同决定。",
            "formula": "f = \\frac{1}{2\\pi\\sqrt{LC}}"
          },
          {
            "text": "电感或电容越大，振荡越慢，频率越低。"
          },
          {
            "text": "电容上的电荷随时间做正弦变化，与简谐振动完全类似。",
            "formula": "q(t) = Q_0\\cos(\\omega t)"
          },
          {
            "text": "电容相当于弹簧的劲度，电感相当于物体的惯性质量。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "观察电荷与电流的正弦振荡，以及电场能、磁场能的此消彼长。"
          },
          {
            "text": "增大电感 L 或电容 C，振荡频率随之降低。"
          },
          {
            "text": "注意能量总和始终不变，只是在电场和磁场之间转换。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "收音机用可调 LC 回路选择不同电台的频率。"
          },
          {
            "text": "振荡电路是产生高频信号的核心，用于通信和广播。"
          },
          {
            "text": "金属探测器也利用 LC 振荡频率的变化来探测金属。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "LC 回路中电场能与磁场能周期性转换，形成电磁振荡。"
          },
          {
            "text": "振荡频率 f 等于 1 除以 2π 根号 LC。"
          },
          {
            "text": "它与简谐振动一一对应，是无线电技术的基石。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "无线电调谐",
        "description": "LC 回路如何选择电台频率"
      },
      {
        "title": "电磁振荡与机械振动",
        "description": "两类振动的深刻类比"
      }
    ]
  },
  {
    "slug": "op-amp",
    "title": "运算放大器",
    "subtitle": "虚短虚断与可设计的增益",
    "category": "电路电子",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/op-amp",
    "sourceChunk": "OpAmpExperiment-D9q65fvt.js",
    "objectives": [
      "理解理想运放的虚短虚断",
      "掌握反相与同相放大电路的增益",
      "认识负反馈对放大器的作用"
    ],
    "prerequisites": [
      "三极管放大器",
      "欧姆定律",
      "负反馈"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到运算放大器实验！运放是模拟电路中最通用、最强大的器件。"
          },
          {
            "text": "它本身的放大倍数极高，但通过外加反馈，我们能精确设计想要的增益。"
          },
          {
            "text": "理解运放，关键在于两条黄金法则：虚短和虚断。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "理想运放有两个输入端：同相端和反相端，开环增益趋于无穷大。"
          },
          {
            "text": "虚短：在负反馈下，两个输入端的电压几乎相等。"
          },
          {
            "text": "虚断：运放输入端几乎不取电流，输入阻抗极高。"
          },
          {
            "text": "利用这两条法则，结合外部电阻，就能算出电路的精确增益。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "反相放大电路的增益等于负的反馈电阻除以输入电阻。",
            "formula": "A_v = -\\frac{R_f}{R_{in}}"
          },
          {
            "text": "负号表示输出与输入反相。"
          },
          {
            "text": "同相放大电路的增益等于一加上反馈电阻除以输入电阻。",
            "formula": "A_v = 1 + \\frac{R_f}{R_{in}}"
          },
          {
            "text": "增益只由外部电阻决定，与运放本身的参数无关，这正是负反馈的威力。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "切换反相和同相两种接法，比较它们的增益和相位。"
          },
          {
            "text": "调整反馈电阻 Rf，观察增益如何随之改变。"
          },
          {
            "text": "注意反相放大输出与输入反相，同相放大则同相。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "运放广泛用于信号放大、滤波、加减运算和比较。"
          },
          {
            "text": "传感器的微弱信号常先经运放放大再处理。"
          },
          {
            "text": "积分器、微分器等运算电路是模拟计算机的基础。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "理想运放遵循虚短虚断两条法则。"
          },
          {
            "text": "反相增益为 −Rf/Rin，同相增益为 1+Rf/Rin，只由外部电阻决定。"
          },
          {
            "text": "负反馈让增益精确可控。运放是模拟电路的万能积木。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "运放的应用电路",
        "description": "积分器、微分器、加法器"
      },
      {
        "title": "负反馈的奥秘",
        "description": "为何反馈能稳定增益"
      }
    ]
  },
  {
    "slug": "rectifier",
    "title": "整流滤波电路",
    "subtitle": "把交流电变成平稳的直流电",
    "category": "电路电子",
    "difficulty": "intermediate",
    "targetAge": "16-18岁",
    "sourcePath": "/rectifier",
    "sourceChunk": "RectifierExperiment-BalX4aOO.js",
    "objectives": [
      "理解二极管整流的原理",
      "区分半波与全波整流",
      "认识电容滤波与纹波"
    ],
    "prerequisites": [
      "二极管",
      "交流电",
      "电容充放电"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到整流滤波电路实验！家里的插座是交流电，但手机、电脑需要直流电。"
          },
          {
            "text": "是谁完成了交流到直流的转换？答案就是整流滤波电路。"
          },
          {
            "text": "今天我们就来看看，二极管和电容如何携手把波动的交流变成平稳的直流。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "整流利用二极管的单向导电性，只让电流朝一个方向通过。"
          },
          {
            "text": "半波整流只保留交流的正半周，负半周被截断。"
          },
          {
            "text": "全波整流把负半周翻转为正，输出脉动更密、利用率更高。"
          },
          {
            "text": "但整流后的电压仍在脉动，需要电容滤波来把它变平稳。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "电容在电压高时充电储能，在电压下降时放电补充，从而填平波谷。"
          },
          {
            "text": "滤波后残余的小幅波动叫做纹波。"
          },
          {
            "text": "电容越大，放电越慢，纹波越小，输出越平稳。",
            "formula": "V_{ripple} \\approx \\frac{I}{fC}"
          },
          {
            "text": "全波整流的纹波频率是半波的两倍，更容易被滤平。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "切换半波和全波整流，比较输出波形的差异。"
          },
          {
            "text": "开启电容滤波，观察脉动的波形如何被平滑成近似直流。"
          },
          {
            "text": "增大滤波电容，纹波明显减小，输出更接近理想直流。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "几乎所有电源适配器都包含整流滤波电路。"
          },
          {
            "text": "桥式整流加大电容滤波，是直流电源的经典方案。"
          },
          {
            "text": "再加上稳压电路，就能得到电子设备需要的稳定电压。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "整流利用二极管单向导电，把交流变成脉动直流。"
          },
          {
            "text": "全波整流比半波利用率更高，电容滤波减小纹波。"
          },
          {
            "text": "电容越大纹波越小。这套电路是直流电源的核心。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "桥式整流",
        "description": "四个二极管的全波整流"
      },
      {
        "title": "稳压电路",
        "description": "进一步获得稳定直流电压"
      }
    ]
  },
  {
    "slug": "wheatstone-bridge",
    "title": "惠斯通电桥",
    "subtitle": "用平衡法精确测量未知电阻",
    "category": "电路电子",
    "difficulty": "intermediate",
    "targetAge": "16-17岁",
    "sourcePath": "/wheatstone-bridge",
    "sourceChunk": "WheatstoneBridgeExperiment-BLUDHkBW.js",
    "objectives": [
      "理解电桥的平衡条件",
      "掌握用比例法测量电阻",
      "认识零示法的高精度优势"
    ],
    "prerequisites": [
      "欧姆定律",
      "串并联电路",
      "电位差"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到惠斯通电桥！它是测量电阻最经典、最精确的电路之一。"
          },
          {
            "text": "四个电阻连成菱形，中间架一个灵敏电流计，就像一座桥。"
          },
          {
            "text": "调节电阻让桥上电流为零，就能精确算出未知电阻。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "电桥由四个电阻 R1、R2、R3、Rx 组成两条并联支路。"
          },
          {
            "text": "桥的中间连一个检流计，检测两点之间是否有电位差。"
          },
          {
            "text": "当两条支路的分压完全相同时，中点电位相等，检流计读数为零。"
          },
          {
            "text": "这种让指针归零的方法叫零示法，不受电源电压波动影响，非常精确。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "电桥平衡时，相对两臂电阻的乘积相等。",
            "formula": "R_1 R_x = R_2 R_3"
          },
          {
            "text": "由此可解出未知电阻 Rx。",
            "formula": "R_x = \\dfrac{R_2 R_3}{R_1}"
          },
          {
            "text": "只要三个已知电阻足够精确，Rx 就能算得非常准。"
          },
          {
            "text": "测量不依赖电流的绝对大小，只看它是否为零。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调节可变电阻 R3，观察检流计指针的偏转。"
          },
          {
            "text": "当指针回到零点时，电桥达到平衡。"
          },
          {
            "text": "此时用平衡公式即可算出未知电阻 Rx 的精确值。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "电桥广泛用于电子秤、压力计中的应变片信号测量。"
          },
          {
            "text": "温度传感器常把热敏电阻接入电桥，灵敏检测温度变化。"
          },
          {
            "text": "零示法的思想至今仍是精密测量的基础。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "惠斯通电桥用四个电阻和一个检流计构成测量电路。"
          },
          {
            "text": "平衡时相对两臂电阻乘积相等，由此精确求出未知电阻。"
          },
          {
            "text": "零示法不依赖电源稳定性，是精密测量的典范。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "应变片与传感器",
        "description": "电桥在称重、压力测量中的应用"
      },
      {
        "title": "零示法测量",
        "description": "为何比直接读数更精确"
      }
    ]
  },
  {
    "slug": "logic-gates",
    "title": "数字逻辑门",
    "subtitle": "0 与 1 构筑的运算世界",
    "category": "电路电子",
    "difficulty": "intermediate",
    "targetAge": "16-17岁",
    "sourcePath": "/logic-gates",
    "sourceChunk": "LogicGatesExperiment-D2NG7O4N.js",
    "objectives": [
      "理解基本逻辑门的功能",
      "掌握真值表",
      "认识逻辑门组合成电路"
    ],
    "prerequisites": [
      "二进制",
      "开关电路",
      "布尔代数"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎进入数字世界！计算机的一切运算，都建立在简单的逻辑门之上。"
          },
          {
            "text": "逻辑门接收 0 和 1 的输入，按规则输出 0 或 1。"
          },
          {
            "text": "几种基本门组合起来，就能完成加减乘除乃至整个 CPU。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "与门只有两个输入都为 1 时才输出 1。"
          },
          {
            "text": "或门只要有一个输入为 1 就输出 1。"
          },
          {
            "text": "非门把输入翻转，0 变 1、1 变 0。"
          },
          {
            "text": "异或门在两输入不同时输出 1，相同时输出 0。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "与运算用乘号表示。",
            "formula": "Y = A \\cdot B"
          },
          {
            "text": "或运算用加号表示。",
            "formula": "Y = A + B"
          },
          {
            "text": "非运算在变量上加一横。",
            "formula": "Y = \\overline{A}"
          },
          {
            "text": "异或用专门的符号表示。",
            "formula": "Y = A \\oplus B"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "切换逻辑门类型，观察它的符号和真值表。"
          },
          {
            "text": "点击切换两个输入的 0 和 1。"
          },
          {
            "text": "看输出灯随输入和门类型实时变化。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "逻辑门组合成加法器，实现二进制加法。"
          },
          {
            "text": "存储单元、计数器也都由逻辑门搭建。"
          },
          {
            "text": "现代芯片集成了数百亿个逻辑门。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "逻辑门按规则把 0、1 输入映射为输出。"
          },
          {
            "text": "与、或、非、异或是最基本的几种门。"
          },
          {
            "text": "它们组合成了整个数字计算世界。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "加法器电路",
        "description": "逻辑门实现二进制加法"
      },
      {
        "title": "CPU 的基石",
        "description": "数十亿逻辑门的集成"
      }
    ]
  },
  {
    "slug": "bernoulli",
    "title": "伯努利原理",
    "subtitle": "流速与压强的此消彼长",
    "category": "流体声学",
    "difficulty": "intermediate",
    "targetAge": "高中至大学",
    "sourcePath": "/bernoulli",
    "sourceChunk": "BernoulliExperiment-DWvCU303.js",
    "objectives": [
      "理解流体连续性方程",
      "掌握伯努利方程",
      "解释流速与压强的关系"
    ],
    "prerequisites": [
      "压强",
      "能量守恒"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到伯努利原理实验！它解释了飞机为什么能飞、球为什么会拐弯。"
          },
          {
            "text": "这根中间变窄的管子叫文丘里管，蓝色小点表示流动的流体。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "流体不可压缩，单位时间流过每个截面的流量都相同。"
          },
          {
            "text": "所以管子变窄时，流速必须增大，你能看到窄段的小点跑得更快。"
          },
          {
            "text": "而流速大的地方压强反而小，这就是伯努利原理。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "连续性方程：截面积乘流速等于常数。",
            "formula": "A_1 v_1 = A_2 v_2"
          },
          {
            "text": "伯努利方程：压强加上动压等于常数。",
            "formula": "p + \\tfrac{1}{2}\\rho v^2 = \\text{const}"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "动手探索",
        "lines": [
          {
            "text": "把窄段调得更窄，窄段流速更大，压强计显示的压强更低。"
          },
          {
            "text": "提高入口流速，整体流速都增大，压强差也随之增大。"
          },
          {
            "text": "观察两个压强计：窄段的总是比宽段的矮。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "飞机机翼上方流速快、压强小，下方压强大，产生升力。"
          },
          {
            "text": "喷雾器、化油器和流量计都基于伯努利原理。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "流速快的地方压强小，流速慢的地方压强大。"
          },
          {
            "text": "这是流体中能量守恒的体现。"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "机翼升力",
        "description": "伯努利与升力的关系"
      },
      {
        "title": "马格努斯效应",
        "description": "旋转球的偏转"
      }
    ]
  },
  {
    "slug": "buoyancy",
    "title": "浮力与阿基米德原理",
    "subtitle": "为什么钢船能浮、铁块会沉",
    "category": "流体声学",
    "difficulty": "beginner",
    "targetAge": "初中至高中",
    "sourcePath": "/buoyancy",
    "sourceChunk": "BuoyancyExperiment-D1Y0Sx3s.js",
    "objectives": [
      "理解浮力的产生",
      "掌握阿基米德原理",
      "判断物体的浮沉条件"
    ],
    "prerequisites": [
      "密度",
      "重力",
      "压强"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到浮力实验！为什么巨大的钢船能漂在水面，小铁块却会沉底？"
          },
          {
            "text": "答案藏在阿基米德两千多年前发现的原理里。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "浸在液体里的物体会受到向上的浮力。"
          },
          {
            "text": "阿基米德原理说：浮力等于物体排开的液体所受的重力。"
          },
          {
            "text": "浮力与重力的比较，决定了物体是浮、是沉还是悬浮。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "浮力等于液体密度乘以重力加速度乘以排开体积。",
            "formula": "F_浮 = \\rho_液 g V_排"
          },
          {
            "text": "物体密度小于液体密度就漂浮。",
            "formula": "\\rho_物 < \\rho_液 \\Rightarrow 漂浮"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "动手探索",
        "lines": [
          {
            "text": "减小物体密度，它浮得更高，露出水面的部分更多。"
          },
          {
            "text": "把物体密度调到等于液体密度，它会悬浮在液体中。"
          },
          {
            "text": "换成海水，密度更大，同样的物体会浮得更高。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "轮船做成空心，平均密度小于水，所以能浮起来。"
          },
          {
            "text": "潜水艇通过改变自身重量来控制下潜与上浮。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "浮力等于排开液体的重力，这就是阿基米德原理。"
          },
          {
            "text": "比较物体与液体的密度，就能判断浮沉。"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "密度计",
        "description": "利用浮力测量液体密度"
      },
      {
        "title": "潜水艇原理",
        "description": "浮力的工程应用"
      }
    ]
  },
  {
    "slug": "fourier-synthesis",
    "title": "傅里叶合成",
    "subtitle": "用正弦波搭建任意波形",
    "category": "流体声学",
    "difficulty": "advanced",
    "targetAge": "高中至大学",
    "sourcePath": "/fourier-synthesis",
    "sourceChunk": "FourierSynthesisExperiment-BsWr6EZb.js",
    "objectives": [
      "理解傅里叶级数的思想",
      "认识谐波与频谱",
      "了解吉布斯现象"
    ],
    "prerequisites": [
      "正弦函数",
      "周期与频率"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到傅里叶合成实验！一个惊人的事实是：任何周期波形都能由正弦波叠加而成。"
          },
          {
            "text": "左边是合成出的波形，右边是它的频谱。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "基频是最低频率的正弦波，频率是它整数倍的叫谐波。"
          },
          {
            "text": "把不同振幅的谐波加在一起，就能逼近方波、锯齿波等复杂波形。"
          },
          {
            "text": "频谱显示了每个谐波的振幅，是波形的另一种表示。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "周期函数可以展开成正弦谐波之和。",
            "formula": "f(x) = \\sum_{n=1}^{\\infty} a_n \\sin(nx)"
          },
          {
            "text": "方波只含奇次谐波，振幅按 1 比 n 衰减。",
            "formula": "a_n = \\frac{4}{\\pi n}\\,(n\\text{ 为奇数})"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "动手探索",
        "lines": [
          {
            "text": "增加谐波数 N，合成波越来越接近理想的方波。"
          },
          {
            "text": "注意方波边缘总有小过冲，无论加多少谐波都消不掉，这叫吉布斯现象。"
          },
          {
            "text": "切换到锯齿波或三角波，观察它们不同的频谱结构。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "傅里叶分析是信号处理、音频压缩和图像处理的核心工具。"
          },
          {
            "text": "乐器音色的差异，本质上就是谐波成分的不同。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "复杂的周期波形都能分解为简单正弦波之和。"
          },
          {
            "text": "时域的波形与频域的频谱，是同一信号的两种视角。"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "傅里叶变换",
        "description": "从周期到非周期信号"
      },
      {
        "title": "吉布斯现象",
        "description": "不连续点附近的过冲"
      }
    ]
  },
  {
    "slug": "karman-vortex",
    "title": "卡门涡街",
    "subtitle": "流体绕过障碍物产生的交替涡旋",
    "category": "流体声学",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/karman-vortex",
    "sourceChunk": "KarmanVortexExperiment-BfsFWbww.js",
    "objectives": [
      "理解流体绕圆柱的涡旋脱落",
      "认识雷诺数对流动形态的影响",
      "了解斯特劳哈尔数与涡街频率"
    ],
    "prerequisites": [
      "流体流动",
      "伯努利原理",
      "雷诺数"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到卡门涡街实验！当风吹过电线，发出呜呜的声音，你听到的就是涡街。"
          },
          {
            "text": "流体绕过圆柱形障碍物时，背后会交替甩出一串旋转的涡旋。"
          },
          {
            "text": "这种规则而美丽的涡旋队列，由流体力学大师冯·卡门最先详细研究。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "流体流过圆柱时，在柱体后方会形成分离的边界层。"
          },
          {
            "text": "两侧的涡旋交替地脱落，一个顺时针、一个逆时针，依次排列。"
          },
          {
            "text": "这种交替脱落形成一条稳定的涡旋街道，就是卡门涡街。"
          },
          {
            "text": "是否产生涡街，取决于一个关键的无量纲数：雷诺数。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "雷诺数衡量惯性力与黏性力之比。",
            "formula": "Re = \\frac{\\rho U d}{\\mu}"
          },
          {
            "text": "雷诺数约在 40 到十万之间时，会出现规则的卡门涡街。"
          },
          {
            "text": "涡旋脱落的频率由斯特劳哈尔数描述。",
            "formula": "St = \\frac{f d}{U} \\approx 0.2"
          },
          {
            "text": "流速越快、柱体越细，涡旋脱落得越频繁，频率越高。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调整流速，观察圆柱后方涡街的脱落与传播。"
          },
          {
            "text": "流速增大，雷诺数增大，涡旋脱落更快，涡街更密集。"
          },
          {
            "text": "注意涡街频率与流速成正比，这正是斯特劳哈尔关系。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "涡街会引起周期性的力，可能导致桥梁、烟囱、电缆的共振。"
          },
          {
            "text": "塔科马大桥的坍塌就与涡街引发的振动有关。"
          },
          {
            "text": "工业上用涡街流量计，通过测量涡旋频率来计算流速。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "流体绕圆柱时背后交替脱落涡旋，形成卡门涡街。"
          },
          {
            "text": "雷诺数决定流动形态，斯特劳哈尔数约 0.2 描述涡街频率。"
          },
          {
            "text": "从呜呜的风声到桥梁振动，涡街无处不在。希望你已领略它的规律之美！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "塔科马大桥",
        "description": "涡街共振引发的桥梁灾难"
      },
      {
        "title": "涡街流量计",
        "description": "利用涡街频率测量流速"
      }
    ]
  },
  {
    "slug": "capillary",
    "title": "表面张力与毛细现象",
    "subtitle": "液面为何在细管中自动升降",
    "category": "流体声学",
    "difficulty": "intermediate",
    "targetAge": "15-18岁",
    "sourcePath": "/capillary",
    "sourceChunk": "CapillaryExperiment-DuXyJmd6.js",
    "objectives": [
      "理解表面张力的成因",
      "掌握毛细上升公式",
      "区分浸润与不浸润现象"
    ],
    "prerequisites": [
      "压强",
      "分子间作用力",
      "液体性质"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到表面张力实验！水黾能在水面上行走，露珠总是圆滚滚的，这都源于表面张力。"
          },
          {
            "text": "把一根细管插进水里，水会自己往上爬；插进水银里，水银却往下缩。"
          },
          {
            "text": "这种神奇的毛细现象，背后正是表面张力在起作用。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "液体表面的分子受到向内的拉力，使表面像一张绷紧的弹性膜。"
          },
          {
            "text": "这种使液面收缩到最小的力，就是表面张力。"
          },
          {
            "text": "当液体浸润管壁时，比如水和玻璃，液面会沿管壁上升。"
          },
          {
            "text": "当液体不浸润管壁时，比如水银和玻璃，液面则会下降。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "毛细管中液面上升的高度由这个公式决定。",
            "formula": "h = \\frac{2\\sigma\\cos\\theta}{\\rho g r}"
          },
          {
            "text": "其中 σ 是表面张力系数，θ 是接触角，r 是管的半径。"
          },
          {
            "text": "管越细，上升越高；接触角小于 90 度时液面上升，大于 90 度时下降。"
          },
          {
            "text": "这就解释了为什么细管中的毛细效应特别明显。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "减小管的半径，观察液面上升得越来越高。"
          },
          {
            "text": "调整接触角，当它超过 90 度时，看液面如何转为下降。"
          },
          {
            "text": "改变表面张力系数，感受不同液体的毛细效果差异。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "植物靠毛细作用，把水分从根部输送到高高的枝叶。"
          },
          {
            "text": "毛巾吸水、钢笔出墨，都是毛细现象的日常体现。"
          },
          {
            "text": "土壤保水、微流控芯片，也都依赖表面张力与毛细效应。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "表面张力使液面像绷紧的膜，趋于收缩到最小。"
          },
          {
            "text": "毛细上升高度 h 等于 2σcosθ 除以 ρgr，管越细上升越高。"
          },
          {
            "text": "浸润时上升、不浸润时下降。从植物吸水到日常生活，毛细现象无处不在。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "植物的水分输送",
        "description": "毛细作用如何帮助树木吸水"
      },
      {
        "title": "杨-拉普拉斯方程",
        "description": "弯曲液面下的附加压强"
      }
    ]
  },
  {
    "slug": "poiseuille",
    "title": "泊肃叶管道流动",
    "subtitle": "黏性流体在管中的层流规律",
    "category": "流体声学",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/poiseuille",
    "sourceChunk": "PoiseuilleExperiment-CJgSxrGA.js",
    "objectives": [
      "理解管道层流的速度分布",
      "掌握泊肃叶定律",
      "认识半径对流量的强烈影响"
    ],
    "prerequisites": [
      "黏性",
      "压强",
      "流量"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到泊肃叶管道流动实验！为什么细水管的水流比粗水管慢得多？"
          },
          {
            "text": "十九世纪，医生泊肃叶在研究血液流动时，发现了管道层流的规律。"
          },
          {
            "text": "这条定律揭示了一个惊人的事实：流量对管子的粗细极其敏感。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "黏性流体在管中缓慢流动时，呈现规则的层流。"
          },
          {
            "text": "紧贴管壁的流体几乎不动，越靠近管中心流速越快。"
          },
          {
            "text": "整个速度分布呈抛物线形，中心速度最大。"
          },
          {
            "text": "这是由流体黏性和压强差共同作用的结果。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "泊肃叶定律给出管道的体积流量。",
            "formula": "Q = \\frac{\\pi r^4 \\Delta P}{8\\eta L}"
          },
          {
            "text": "其中 r 是管半径，ΔP 是压强差，η 是黏度，L 是管长。"
          },
          {
            "text": "最关键的是，流量与半径的四次方成正比！"
          },
          {
            "text": "半径增大一倍，流量增大十六倍，这就是粗管流量远大于细管的原因。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "观察管内抛物线形的速度分布，中心快、管壁慢。"
          },
          {
            "text": "稍稍增大管半径，流量就急剧增加，因为是四次方关系。"
          },
          {
            "text": "增大黏度，流量减小，流体流动变得更困难。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "血管轻微变窄就会大幅减少血流量，这对心血管健康至关重要。"
          },
          {
            "text": "工业管道设计要权衡管径、压力和流量。"
          },
          {
            "text": "泊肃叶定律也用于测量流体的黏度。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "管道层流速度呈抛物线分布，中心最快、管壁为零。"
          },
          {
            "text": "泊肃叶定律 Q 正比于 r 的四次方，对管径极其敏感。"
          },
          {
            "text": "从血液循环到工业管道，这条定律意义重大。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "血液循环",
        "description": "血管半径与血流量的关系"
      },
      {
        "title": "层流与湍流",
        "description": "雷诺数决定流动形态"
      }
    ]
  },
  {
    "slug": "stokes-law",
    "title": "斯托克斯定律与终端速度",
    "subtitle": "小球在黏性流体中的沉降",
    "category": "流体声学",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/stokes-law",
    "sourceChunk": "StokesLawExperiment-khBcxcFn.js",
    "objectives": [
      "理解黏滞阻力与斯托克斯定律",
      "掌握终端速度的概念",
      "认识力平衡下的匀速运动"
    ],
    "prerequisites": [
      "浮力",
      "黏性",
      "牛顿第二定律"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到斯托克斯定律实验！把一个小球放进蜂蜜里，它会缓缓匀速下沉。"
          },
          {
            "text": "为什么不是越来越快，而是稳定在一个速度？"
          },
          {
            "text": "答案就藏在黏滞阻力与终端速度的奥妙之中。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "小球在黏性流体中运动，会受到与速度方向相反的黏滞阻力。"
          },
          {
            "text": "速度越快，阻力越大，这与高速运动的空气阻力不同。"
          },
          {
            "text": "小球受重力向下，浮力和黏滞阻力向上。"
          },
          {
            "text": "当三力平衡时，加速度为零，小球以恒定的终端速度匀速下沉。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "斯托克斯定律给出小球受到的黏滞阻力。",
            "formula": "F = 6\\pi\\eta r v"
          },
          {
            "text": "其中 η 是流体黏度，r 是小球半径，v 是速度。"
          },
          {
            "text": "令重力等于浮力加阻力，可解出终端速度。",
            "formula": "v_t = \\frac{2r^2(\\rho_s - \\rho_f)g}{9\\eta}"
          },
          {
            "text": "终端速度与半径的平方成正比，与黏度成反比。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "观察小球先加速、阻力渐增，最终达到匀速的终端速度。"
          },
          {
            "text": "增大小球半径，终端速度按平方关系迅速增大。"
          },
          {
            "text": "增大流体黏度，小球下沉得更慢。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "密立根用油滴的终端速度，精确测出了电子的电荷。"
          },
          {
            "text": "沉降法通过终端速度测量微小颗粒的大小。"
          },
          {
            "text": "雨滴、尘埃在空气中的下落速度也遵循类似规律。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "黏滞阻力 F 等于 6πηrv，随速度增大。"
          },
          {
            "text": "重力、浮力、阻力平衡时，小球达到终端速度 vt。"
          },
          {
            "text": "终端速度正比于半径平方、反比于黏度。从油滴实验到沉降分析，应用广泛。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "密立根油滴实验",
        "description": "用终端速度测电子电荷"
      },
      {
        "title": "沉降分析",
        "description": "颗粒大小的测定方法"
      }
    ]
  },
  {
    "slug": "water-wave",
    "title": "水波与重力波",
    "subtitle": "水面波的色散与传播",
    "category": "流体声学",
    "difficulty": "advanced",
    "targetAge": "16-18岁",
    "sourcePath": "/water-wave",
    "sourceChunk": "WaterWaveExperiment-BlgfwF-d.js",
    "objectives": [
      "理解水面重力波的色散关系",
      "认识波长与波速的关系",
      "了解深水波与浅水波的差异"
    ],
    "prerequisites": [
      "波速",
      "色散",
      "群速度与相速度"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到水波实验！海面上的波浪，有的舒缓绵长，有的细碎急促。"
          },
          {
            "text": "你可能没注意，不同波长的水波，传播速度其实并不相同。"
          },
          {
            "text": "今天我们就来探索水面重力波的色散规律。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "水面波主要靠重力作为回复力，称为重力波。"
          },
          {
            "text": "水的质点其实做近似圆周运动，并不随波远行。"
          },
          {
            "text": "在深水中，波长越长的波传播得越快，这就是色散。"
          },
          {
            "text": "在浅水中，情况不同，波速主要由水深决定。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "深水重力波的相速度由波长决定。",
            "formula": "v = \\sqrt{\\frac{g\\lambda}{2\\pi}}"
          },
          {
            "text": "波长越长，波速越大，所以长波跑在前面。"
          },
          {
            "text": "深水波的群速度只有相速度的一半。",
            "formula": "v_g = \\frac{1}{2}v_p"
          },
          {
            "text": "在浅水中，波速近似只与水深 h 有关。",
            "formula": "v \\approx \\sqrt{gh}"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调整波长，观察水波的传播速度如何变化。"
          },
          {
            "text": "长波传播明显更快，这与声波、光波在无色散介质中不同。"
          },
          {
            "text": "注意水面质点做圆周运动，波形向前但水不前进。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "海啸是超长波长的浅水波，速度可达每小时几百公里。"
          },
          {
            "text": "远处风暴产生的长涌浪会先于短浪抵达海岸。"
          },
          {
            "text": "船行波、港口设计都需要考虑水波的色散特性。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "深水重力波相速度 v 等于根号下 gλ 除以 2π，长波更快。"
          },
          {
            "text": "群速度是相速度的一半，浅水波速由水深决定。"
          },
          {
            "text": "从涌浪到海啸，水波的色散塑造了海洋的律动。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "海啸",
        "description": "浅水波为何传播极快"
      },
      {
        "title": "船行波",
        "description": "开尔文船波的形成"
      }
    ]
  },
  {
    "slug": "venturi",
    "title": "文丘里管",
    "subtitle": "管道收缩处的流速与压强",
    "category": "流体声学",
    "difficulty": "intermediate",
    "targetAge": "16-17岁",
    "sourcePath": "/venturi",
    "sourceChunk": "VenturiExperiment-CFQkdv6b.js",
    "objectives": [
      "理解连续性方程",
      "掌握伯努利原理在变截面管中的应用",
      "认识文丘里效应"
    ],
    "prerequisites": [
      "伯努利原理",
      "连续性方程",
      "流体压强"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到文丘里管！它是一根中间收窄的特殊管道。"
          },
          {
            "text": "流体经过窄处时会加速，压强反而下降。"
          },
          {
            "text": "这个看似反常的现象，正是伯努利原理的精彩体现。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "流体不可压缩，单位时间流过每个截面的流量相同。"
          },
          {
            "text": "截面越小，流速必须越大，这是连续性方程。"
          },
          {
            "text": "流速增大，动能增加，根据伯努利原理压强必然下降。"
          },
          {
            "text": "所以窄处流速最快、压强最低。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "连续性方程：截面积乘流速处处相等。",
            "formula": "A_1 v_1 = A_2 v_2"
          },
          {
            "text": "伯努利方程：压强与动压之和守恒。",
            "formula": "P + \\tfrac{1}{2}\\rho v^2 = \\text{const}"
          },
          {
            "text": "窄处面积小一半，流速就快一倍。"
          },
          {
            "text": "流速越快的地方，压强越低。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调节喉部收缩比，观察窄处流速和压强的变化。"
          },
          {
            "text": "改变入口流速，看压强差如何响应。"
          },
          {
            "text": "注意截面越小、流速越快、压强越低的规律。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "汽车化油器靠文丘里效应把汽油吸入气流。"
          },
          {
            "text": "喷雾器、香水瓶也利用同样的低压吸液原理。"
          },
          {
            "text": "文丘里流量计广泛用于工业管道测流量。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "文丘里管中，截面收窄使流速增大、压强下降。"
          },
          {
            "text": "连续性方程与伯努利原理共同决定了流动。"
          },
          {
            "text": "它是流量测量与吸液装置的基础。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "化油器与喷雾器",
        "description": "文丘里效应的应用"
      },
      {
        "title": "文丘里流量计",
        "description": "测量管道流量"
      }
    ]
  },
  {
    "slug": "reynolds-number",
    "title": "雷诺数与层流湍流",
    "subtitle": "决定流动是平稳还是混乱的数字",
    "category": "流体声学",
    "difficulty": "intermediate",
    "targetAge": "16-17岁",
    "sourcePath": "/reynolds-number",
    "sourceChunk": "ReynoldsNumberExperiment-DRLBdqIP.js",
    "objectives": [
      "理解惯性力与黏性力的竞争",
      "掌握雷诺数的定义",
      "认识层流向湍流的转变"
    ],
    "prerequisites": [
      "黏性",
      "流速",
      "流体力学"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎认识雷诺数！同样是水流，为何有时平静如丝，有时翻腾如沸？"
          },
          {
            "text": "答案藏在一个无量纲的数字里，它叫雷诺数。"
          },
          {
            "text": "它告诉我们流动会保持层流，还是转入湍流。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "流体中有两种力在较量：推动混乱的惯性力，和抑制混乱的黏性力。"
          },
          {
            "text": "雷诺数就是惯性力与黏性力的比值。"
          },
          {
            "text": "雷诺数小时，黏性占上风，流动平滑分层，叫层流。"
          },
          {
            "text": "雷诺数大时，惯性占上风，流动失稳翻滚，叫湍流。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "雷诺数由密度、速度、特征尺寸和黏度决定。",
            "formula": "Re = \\dfrac{\\rho v L}{\\mu}"
          },
          {
            "text": "管道中雷诺数小于约 2300 时为层流。"
          },
          {
            "text": "大于约 4000 时为湍流，中间是过渡区。"
          },
          {
            "text": "速度越快、管子越粗，越容易进入湍流。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调节流速，观察流线从平直到卷曲的转变。"
          },
          {
            "text": "改变黏度，看雷诺数如何反向变化。"
          },
          {
            "text": "注意雷诺数跨过临界值时流态的突变。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "飞机机翼设计必须考虑雷诺数以控制阻力。"
          },
          {
            "text": "血管中血流通常是层流，狭窄处可能转为湍流。"
          },
          {
            "text": "管道工程靠雷诺数预测流动状态和压损。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "雷诺数 Re=ρvL/μ 是惯性力与黏性力之比。"
          },
          {
            "text": "Re 小为层流，Re 大为湍流，临界值约 2300。"
          },
          {
            "text": "它是流体工程中最重要的判据之一。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "湍流的复杂性",
        "description": "至今未完全解决的物理难题"
      },
      {
        "title": "血流与管道设计",
        "description": "雷诺数的工程应用"
      }
    ]
  },
  {
    "slug": "gravitation",
    "title": "万有引力与卫星轨道",
    "subtitle": "从苹果落地到行星绕日的宇宙法则",
    "category": "天体物理",
    "difficulty": "advanced",
    "targetAge": "16-18岁",
    "sourcePath": "/gravitation",
    "sourceChunk": "GravitationExperiment-DTVUJLhS.js",
    "objectives": [
      "理解万有引力定律 F = GMm/r²",
      "掌握圆轨道速度与开普勒第三定律",
      "认识引力如何维持天体运动"
    ],
    "prerequisites": [
      "向心力",
      "圆周运动",
      "牛顿运动定律"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到万有引力实验！传说牛顿看到苹果落地，悟出了支配整个宇宙的法则。"
          },
          {
            "text": "同样一种力，既让苹果落向地面，也让月亮绕着地球转，让行星绕着太阳运行。"
          },
          {
            "text": "今天我们就来探索这个伟大的定律，看看卫星如何在引力中划出优美的轨道。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "任何两个有质量的物体之间都存在相互吸引的力，这就是万有引力。"
          },
          {
            "text": "引力的大小与两物体质量的乘积成正比，与它们距离的平方成反比。"
          },
          {
            "text": "对于绕地球运动的卫星，正是地球的引力充当了向心力。"
          },
          {
            "text": "引力只改变卫星的运动方向，让它一直绕着地球转，而不会飞走或坠落。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "万有引力定律的表达式如下，G 是万有引力常量。",
            "formula": "F = G\\frac{Mm}{r^2}"
          },
          {
            "text": "让引力等于向心力，可以求出圆轨道的环绕速度。",
            "formula": "v = \\sqrt{\\frac{GM}{r}}"
          },
          {
            "text": "轨道半径越大，环绕速度越小，运行越慢。"
          },
          {
            "text": "开普勒第三定律指出，轨道周期的平方正比于半长轴的立方。",
            "formula": "T^2 \\propto a^3"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调整卫星的初始速度，观察轨道如何从圆形变成椭圆。"
          },
          {
            "text": "速度太小，卫星会坠向地球；速度太大，则会挣脱引力飞向远方。"
          },
          {
            "text": "注意椭圆轨道上，卫星靠近地球时跑得快，远离时跑得慢，这正是开普勒第二定律。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "通信卫星运行在特定高度，使周期恰好等于地球自转，成为同步卫星。"
          },
          {
            "text": "宇宙飞船利用引力弹弓，借助行星引力加速飞向更远的深空。"
          },
          {
            "text": "万有引力定律还帮助天文学家发现了海王星等看不见的天体。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "万有引力与质量乘积成正比，与距离平方成反比。"
          },
          {
            "text": "引力充当向心力，圆轨道速度为根号下 GM 除以 r。"
          },
          {
            "text": "从苹果到行星，同一个定律支配着整个宇宙。希望你已感受到它的伟大！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "第一宇宙速度",
        "description": "卫星环绕地球所需的最小速度"
      },
      {
        "title": "开普勒三定律",
        "description": "行星运动的几何与时间规律"
      }
    ]
  },
  {
    "slug": "kepler-laws",
    "title": "开普勒三定律",
    "subtitle": "行星运动的几何与时间规律",
    "category": "天体物理",
    "difficulty": "advanced",
    "targetAge": "16-18岁",
    "sourcePath": "/kepler-laws",
    "sourceChunk": "KeplerLawsExperiment-D5lOr9RU.js",
    "objectives": [
      "理解行星轨道是以恒星为焦点的椭圆",
      "掌握等面积定律与近日点加速规律",
      "理解周期与半长轴的 T²∝a³ 关系"
    ],
    "prerequisites": [
      "万有引力",
      "椭圆几何",
      "角动量守恒"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到开普勒定律实验！十七世纪初，开普勒分析了大量行星观测数据。"
          },
          {
            "text": "他从纷繁的数字中，总结出三条优美而精确的行星运动定律。"
          },
          {
            "text": "这三条定律不仅描绘了太阳系的运行，也为牛顿发现万有引力铺平了道路。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "第一定律说，行星沿椭圆轨道运行，太阳位于椭圆的一个焦点上。"
          },
          {
            "text": "第二定律说，连接行星和太阳的线段，在相等时间内扫过相等的面积。"
          },
          {
            "text": "这意味着行星在近日点跑得快，在远日点跑得慢。"
          },
          {
            "text": "第三定律揭示了不同行星之间的关系：周期越长，轨道越大。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "第二定律本质上是角动量守恒，扫过面积的速率保持恒定。",
            "formula": "\\frac{dA}{dt} = \\text{常数}"
          },
          {
            "text": "第三定律指出，轨道周期的平方与半长轴的立方成正比。",
            "formula": "T^2 \\propto a^3"
          },
          {
            "text": "更精确地说，T 平方除以 a 立方等于一个由中心天体质量决定的常数。",
            "formula": "\\frac{T^2}{a^3} = \\frac{4\\pi^2}{GM}"
          },
          {
            "text": "对太阳系所有行星，这个比值都相同，这正是定律的奇妙之处。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调整轨道的偏心率，观察椭圆从接近圆形变得越来越扁。"
          },
          {
            "text": "注意行星扫过的扇形面积，相等时间内它们的面积始终相等。"
          },
          {
            "text": "改变半长轴，看周期如何按照 T 平方正比于 a 立方的规律变化。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "开普勒定律让我们能精确预测行星、彗星和卫星的位置。"
          },
          {
            "text": "哈雷正是用这些规律，预言了哈雷彗星的回归。"
          },
          {
            "text": "现代航天器的轨道设计，依然建立在开普勒定律的基础之上。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "第一定律：行星沿椭圆轨道运行，太阳在一个焦点上。"
          },
          {
            "text": "第二定律：等时间扫过等面积，近日点快、远日点慢。"
          },
          {
            "text": "第三定律：周期平方正比于半长轴立方。三条定律共同描绘了天体的舞蹈。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "牛顿对开普勒定律的推导",
        "description": "万有引力如何解释开普勒定律"
      },
      {
        "title": "行星轨道数据",
        "description": "太阳系各行星的轨道参数"
      }
    ]
  },
  {
    "slug": "binary-star",
    "title": "双星系统",
    "subtitle": "两颗恒星绕共同质心的引力之舞",
    "category": "天体物理",
    "difficulty": "advanced",
    "targetAge": "16-18岁",
    "sourcePath": "/binary-star",
    "sourceChunk": "BinaryStarExperiment-8KceLSik.js",
    "objectives": [
      "理解双星绕共同质心运动",
      "掌握质量与轨道半径的反比关系",
      "认识双星系统在天文观测中的意义"
    ],
    "prerequisites": [
      "万有引力",
      "质心",
      "圆周运动"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到双星系统实验！宇宙中超过半数的恒星，并非像太阳那样孤独。"
          },
          {
            "text": "它们成对存在，两颗恒星在彼此的引力牵引下，跳着永恒的圆舞。"
          },
          {
            "text": "今天我们就来看看，这场引力之舞遵循着怎样的规律。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "双星系统中，两颗恒星都绕着它们共同的质心运动。"
          },
          {
            "text": "质心是两颗星质量的平衡点，它在空间中保持静止或匀速运动。"
          },
          {
            "text": "两颗星始终位于质心的两侧，连线永远经过质心。"
          },
          {
            "text": "质量大的星离质心近，绕得圈子小；质量小的星离得远，绕得圈子大。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "质心条件要求两星的质量乘以各自到质心的距离相等。",
            "formula": "m_1 r_1 = m_2 r_2"
          },
          {
            "text": "所以轨道半径之比，等于质量的反比。",
            "formula": "\\frac{r_1}{r_2} = \\frac{m_2}{m_1}"
          },
          {
            "text": "两颗星有相同的周期，它们总是同步地转动。"
          },
          {
            "text": "它们之间的万有引力，正好为各自的圆周运动提供向心力。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调整两颗星的质量比，观察它们的轨道半径如何变化。"
          },
          {
            "text": "质量越大的星，轨道越小，几乎在质心附近小幅摆动。"
          },
          {
            "text": "当两星质量相等时，它们绕着正中间的质心做完全对称的运动。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "天文学家通过恒星的周期摆动，能推算出它的伴星甚至系外行星。"
          },
          {
            "text": "致密双星如中子星互相绕转并合并时，会释放出强烈的引力波。"
          },
          {
            "text": "研究双星，是测量恒星质量最可靠的方法之一。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "双星绕共同质心运动，连线始终经过质心。"
          },
          {
            "text": "质量与轨道半径成反比，m1 r1 等于 m2 r2。"
          },
          {
            "text": "从测量恒星质量到探测引力波，双星系统是天文学的重要窗口。希望你已领略这场引力之舞！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "引力波",
        "description": "致密双星合并如何产生引力波"
      },
      {
        "title": "系外行星探测",
        "description": "恒星摆动如何揭示看不见的伴星"
      }
    ]
  },
  {
    "slug": "cosmic-velocity",
    "title": "宇宙速度与发射",
    "subtitle": "从环绕地球到飞出太阳系的速度门槛",
    "category": "天体物理",
    "difficulty": "intermediate",
    "targetAge": "15-18岁",
    "sourcePath": "/cosmic-velocity",
    "sourceChunk": "CosmicVelocityExperiment-BceZwd1E.js",
    "objectives": [
      "理解第一、第二、第三宇宙速度的含义",
      "掌握环绕速度与逃逸速度的关系",
      "认识发射速度如何决定轨道形态"
    ],
    "prerequisites": [
      "万有引力",
      "圆周运动",
      "机械能守恒"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到宇宙速度实验！牛顿曾设想在高山上架一门大炮，水平发射炮弹。"
          },
          {
            "text": "速度越快，炮弹落得越远；当速度足够大时，炮弹竟然绕地球一圈又回到原点。"
          },
          {
            "text": "这就引出了宇宙速度的概念，决定了人类能否飞向太空。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "第一宇宙速度，是物体贴着地面环绕地球做圆周运动所需的速度，约 7.9 公里每秒。"
          },
          {
            "text": "第二宇宙速度，是物体彻底挣脱地球引力所需的速度，约 11.2 公里每秒。"
          },
          {
            "text": "第三宇宙速度，是飞出太阳系所需的速度，约 16.7 公里每秒。"
          },
          {
            "text": "发射速度不同，物体的轨道会从抛物线、圆、椭圆变成逃逸的双曲线。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "第一宇宙速度由引力提供向心力得到，等于根号下 g 乘以地球半径。",
            "formula": "v_1 = \\sqrt{gR} = \\sqrt{\\frac{GM}{R}}"
          },
          {
            "text": "第二宇宙速度由机械能守恒得到，是第一宇宙速度的根号二倍。",
            "formula": "v_2 = \\sqrt{2gR} = \\sqrt{2}\\,v_1"
          },
          {
            "text": "当发射速度小于第一宇宙速度，物体会落回地面。"
          },
          {
            "text": "介于第一与第二宇宙速度之间时，物体进入椭圆轨道环绕地球。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "逐渐增大发射速度，观察轨道从坠落变为环绕，再到逃逸。"
          },
          {
            "text": "恰好达到第一宇宙速度时，轨道变成贴近地表的圆。"
          },
          {
            "text": "超过第二宇宙速度时，轨道张开成双曲线，物体一去不返。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "人造卫星必须达到第一宇宙速度，才能稳定地绕地球运行。"
          },
          {
            "text": "探月和探火飞船需要接近第二宇宙速度，才能飞离地球。"
          },
          {
            "text": "旅行者号探测器借助行星引力加速，最终达到第三宇宙速度飞出太阳系。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "第一宇宙速度 7.9 公里每秒是环绕速度，第二宇宙速度 11.2 公里每秒是逃逸速度。"
          },
          {
            "text": "逃逸速度是环绕速度的根号二倍，第三宇宙速度则可飞出太阳系。"
          },
          {
            "text": "发射速度决定轨道形态。这些速度门槛，标记着人类迈向深空的脚步。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "牛顿大炮",
        "description": "牛顿设想的环绕地球的炮弹"
      },
      {
        "title": "火箭与第一宇宙速度",
        "description": "人造卫星如何进入轨道"
      }
    ]
  },
  {
    "slug": "gravitational-lensing",
    "title": "引力透镜",
    "subtitle": "弯曲时空让光线绕行",
    "category": "天体物理",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/gravitational-lensing",
    "sourceChunk": "GravitationalLensingExperiment-CGiPNn6u.js",
    "objectives": [
      "理解大质量天体对光线的偏折",
      "认识爱因斯坦环与多重像",
      "了解引力透镜的天文应用"
    ],
    "prerequisites": [
      "万有引力",
      "光的传播",
      "广义相对论初步"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到引力透镜实验！爱因斯坦的广义相对论告诉我们，质量会弯曲它周围的时空。"
          },
          {
            "text": "光线沿着弯曲的时空传播，路径也随之弯折，就像穿过一块透镜。"
          },
          {
            "text": "这种现象让我们能看到被前方天体遮挡的遥远星系，甚至称量看不见的暗物质。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "当遥远光源、大质量天体和观测者几乎排成一条直线时，引力透镜效应最显著。"
          },
          {
            "text": "光源发出的光经过大质量天体附近时被偏折，从两侧绕过来。"
          },
          {
            "text": "观测者会看到光源被拉伸成弧，甚至形成一个完整的光环。"
          },
          {
            "text": "这个明亮的光环被称为爱因斯坦环。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "光线经过质量 M、瞄准距离 b 时的偏折角由这个公式给出。",
            "formula": "\\alpha = \\frac{4GM}{c^2 b}"
          },
          {
            "text": "质量越大、光线越靠近天体，偏折角就越大。"
          },
          {
            "text": "注意这个偏折角是牛顿理论预言值的两倍，正是广义相对论的关键预言。"
          },
          {
            "text": "1919 年的日食观测测得了太阳对星光的偏折，验证了爱因斯坦的理论。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调整透镜天体的质量，观察背景光源被弯曲的程度。"
          },
          {
            "text": "当光源、透镜、观测者对齐时，会出现完整的爱因斯坦环。"
          },
          {
            "text": "移动光源偏离中心，光环会断裂成几段明亮的弧。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "引力透镜像天然的望远镜，放大遥远而暗弱的星系。"
          },
          {
            "text": "通过透镜效应的强弱，天文学家能测量星系团中暗物质的分布。"
          },
          {
            "text": "微引力透镜还被用来搜寻系外行星和孤立的黑洞。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "大质量天体弯曲时空，使光线偏折，形成引力透镜。"
          },
          {
            "text": "偏折角等于 4GM 除以 c 平方乘以瞄准距离，对齐时形成爱因斯坦环。"
          },
          {
            "text": "它既验证了广义相对论，又成为探测暗物质的利器。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "1919 年日食观测",
        "description": "爱丁顿验证广义相对论"
      },
      {
        "title": "暗物质与引力透镜",
        "description": "用透镜效应称量看不见的质量"
      }
    ]
  },
  {
    "slug": "tidal-force",
    "title": "潮汐力与潮汐现象",
    "subtitle": "引力梯度如何造就海洋的涨落",
    "category": "天体物理",
    "difficulty": "advanced",
    "targetAge": "16-18岁",
    "sourcePath": "/tidal-force",
    "sourceChunk": "TidalForceExperiment-CXH8fnXd.js",
    "objectives": [
      "理解潮汐力的引力梯度成因",
      "认识近端与远端双潮汐隆起",
      "了解潮汐力与距离的三次方反比关系"
    ],
    "prerequisites": [
      "万有引力",
      "参考系",
      "相对加速度"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到潮汐力实验！海水每天两次涨落，这壮观的潮汐主要由月球引起。"
          },
          {
            "text": "有趣的是，面向月球和背向月球的两侧，都会出现高潮。"
          },
          {
            "text": "为什么背对月球的一侧也会涨潮？答案藏在引力的微小差异里。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "月球对地球各处的引力并不相同，近的一侧受到的引力更强。"
          },
          {
            "text": "以地球中心为参考，近月端的海水被额外拉向月球，形成高潮。"
          },
          {
            "text": "远月端受到的引力最弱，相对地球中心被\"甩\"向外侧，也形成高潮。"
          },
          {
            "text": "于是地球两侧各鼓起一个潮汐隆起，地球自转使各地一天经历两次涨落。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "潮汐力来自引力随距离的变化，即引力梯度。"
          },
          {
            "text": "对半径为 R、距离为 d 的天体，潮汐加速度近似如下。",
            "formula": "a_{tidal} \\approx \\frac{2GMR}{d^3}"
          },
          {
            "text": "关键在于它与距离的三次方成反比，比引力本身衰减得更快。"
          },
          {
            "text": "正因如此，虽然太阳引力更大，但近得多的月球产生的潮汐却更强。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "观察地球两侧的潮汐隆起，以及各点受到的潮汐力箭头。"
          },
          {
            "text": "拉近施力天体的距离，潮汐力急剧增大，隆起更明显。"
          },
          {
            "text": "注意潮汐力指向：近端和远端向外，两侧向内。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "潮汐能发电利用潮水的涨落，是一种清洁能源。"
          },
          {
            "text": "潮汐锁定让月球永远以同一面朝向地球。"
          },
          {
            "text": "当潮汐力过强超过洛希极限，天体会被撕碎，形成行星环。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "潮汐力源于引力梯度，使天体近端和远端各鼓起一个隆起。"
          },
          {
            "text": "潮汐加速度近似正比于 2GMR 除以 d 的三次方，随距离迅速衰减。"
          },
          {
            "text": "从海洋潮汐到潮汐锁定，这一效应塑造着天体的命运。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "洛希极限",
        "description": "潮汐力撕碎天体的临界距离"
      },
      {
        "title": "潮汐锁定",
        "description": "月球为何总以同一面对着地球"
      }
    ]
  },
  {
    "slug": "lagrange-points",
    "title": "拉格朗日点",
    "subtitle": "引力与离心力平衡的太空驻泊点",
    "category": "天体物理",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/lagrange-points",
    "sourceChunk": "LagrangePointsExperiment-BdXLFJVX.js",
    "objectives": [
      "理解旋转参考系中的有效势",
      "认识五个拉格朗日点的位置",
      "区分稳定与不稳定的平衡点"
    ],
    "prerequisites": [
      "万有引力",
      "离心力",
      "双星系统"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到拉格朗日点实验！在地球和太阳之间，存在几个神奇的平衡点。"
          },
          {
            "text": "航天器停在那里，几乎不用动力就能与地球同步绕太阳运行。"
          },
          {
            "text": "韦伯空间望远镜就驻泊在其中一个点上，这就是拉格朗日点的妙用。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "在随两天体一起旋转的参考系中，物体受到引力和离心力的共同作用。"
          },
          {
            "text": "在某些特殊位置，这些力恰好平衡，物体可以相对静止。"
          },
          {
            "text": "这样的平衡点共有五个，记作 L1 到 L5。"
          },
          {
            "text": "L1、L2、L3 在两天体连线上，L4、L5 与两天体构成等边三角形。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "在旋转参考系中，物体处于有效势的极值点便达到平衡。"
          },
          {
            "text": "有效势包含引力势和离心势两部分。",
            "formula": "U_{eff} = -\\frac{GM_1}{r_1} - \\frac{GM_2}{r_2} - \\frac{1}{2}\\omega^2 r^2"
          },
          {
            "text": "L1、L2、L3 是势的鞍点，属于不稳定平衡，需要少量修正才能驻留。"
          },
          {
            "text": "L4、L5 在质量比足够大时是稳定的，物体会自然聚集在那里。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "观察五个拉格朗日点的位置，以及有效势的等高线。"
          },
          {
            "text": "调整两天体的质量比，看各点位置如何移动。"
          },
          {
            "text": "L4 和 L5 始终与两天体构成等边三角形，十分对称。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "日地 L1 点适合观测太阳，太阳风探测器常驻于此。"
          },
          {
            "text": "日地 L2 点远离地球热辐射，是韦伯望远镜等深空观测的理想位置。"
          },
          {
            "text": "木星的 L4、L5 点聚集着大量特洛伊小行星。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "拉格朗日点是旋转参考系中引力与离心力平衡的五个点。"
          },
          {
            "text": "L1、L2、L3 在连线上不稳定，L4、L5 在等边三角形顶点可稳定。"
          },
          {
            "text": "从太空望远镜到特洛伊小行星，拉格朗日点意义非凡。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "韦伯望远镜与 L2",
        "description": "为何望远镜停在 L2 点"
      },
      {
        "title": "特洛伊小行星",
        "description": "聚集在 L4、L5 的天体"
      }
    ]
  },
  {
    "slug": "black-hole",
    "title": "黑洞与史瓦西半径",
    "subtitle": "当逃逸速度超过光速",
    "category": "天体物理",
    "difficulty": "advanced",
    "targetAge": "16-17岁",
    "sourcePath": "/black-hole",
    "sourceChunk": "BlackHoleExperiment-bjiBk3ns.js",
    "objectives": [
      "理解逃逸速度与黑洞的关系",
      "掌握史瓦西半径的计算",
      "认识事件视界与引力红移"
    ],
    "prerequisites": [
      "万有引力",
      "逃逸速度",
      "光速"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎走近黑洞！它是宇宙中引力最强的天体，连光都无法逃离。"
          },
          {
            "text": "把足够多的质量压缩到足够小，引力就会强到光也被困住。"
          },
          {
            "text": "这个\"有去无回\"的边界，就是史瓦西半径划出的事件视界。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "逃离一个天体需要达到逃逸速度，质量越大、半径越小，逃逸速度越高。"
          },
          {
            "text": "当逃逸速度等于光速时，连光都无法逃出，黑洞就形成了。"
          },
          {
            "text": "此时天体的半径叫史瓦西半径，对应的球面叫事件视界。"
          },
          {
            "text": "一旦越过事件视界，任何物质和信息都无法返回外界。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "逃逸速度由质量和半径决定。",
            "formula": "v_e = \\sqrt{\\dfrac{2GM}{R}}"
          },
          {
            "text": "令逃逸速度等于光速，解出史瓦西半径。",
            "formula": "R_s = \\dfrac{2GM}{c^2}"
          },
          {
            "text": "太阳若变成黑洞，史瓦西半径只有约 3 公里。"
          },
          {
            "text": "地球的史瓦西半径更小，只有约 9 毫米，比一颗黄豆还小。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调节天体质量，观察史瓦西半径如何随之线性增大。"
          },
          {
            "text": "把质量调到恒星级甚至超大质量，感受黑洞尺度的差异。"
          },
          {
            "text": "注意事件视界附近的引力红移，光被拉长、变暗。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "2019 年事件视界望远镜拍下了人类首张黑洞照片。"
          },
          {
            "text": "银河系中心潜伏着一个四百万倍太阳质量的超大质量黑洞。"
          },
          {
            "text": "黑洞合并产生的引力波，已被 LIGO 多次探测到。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "当逃逸速度达到光速，天体就成为黑洞。"
          },
          {
            "text": "史瓦西半径 Rs=2GM/c² 标出了事件视界的大小。"
          },
          {
            "text": "它与质量成正比，是理解黑洞的钥匙。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "事件视界望远镜",
        "description": "人类首张黑洞照片"
      },
      {
        "title": "引力时间膨胀",
        "description": "黑洞附近时间变慢"
      }
    ]
  },
  {
    "slug": "hubble-law",
    "title": "哈勃定律与宇宙膨胀",
    "subtitle": "星系退行速度与距离成正比",
    "category": "天体物理",
    "difficulty": "intermediate",
    "targetAge": "16-17岁",
    "sourcePath": "/hubble-law",
    "sourceChunk": "HubbleLawExperiment-DSOc6_3U.js",
    "objectives": [
      "理解星系退行与红移",
      "掌握哈勃定律 v=H₀d",
      "认识宇宙膨胀与宇宙年龄"
    ],
    "prerequisites": [
      "多普勒效应",
      "光谱红移",
      "速度与距离"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎仰望宇宙！1929 年，哈勃发现一个惊人的规律：星系都在远离我们。"
          },
          {
            "text": "而且越远的星系，退行得越快，这意味着整个宇宙正在膨胀。"
          },
          {
            "text": "这是 20 世纪最伟大的天文发现之一，把我们引向了大爆炸理论。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "远方星系发出的光，谱线整体向红端移动，这叫红移。"
          },
          {
            "text": "红移源于星系正在远离，类似声音的多普勒效应。"
          },
          {
            "text": "哈勃测量大量星系，发现退行速度与距离成正比。"
          },
          {
            "text": "这不是星系在空间中飞奔，而是空间本身在膨胀，把星系带远。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "哈勃定律：退行速度等于哈勃常数乘以距离。",
            "formula": "v = H_0 d"
          },
          {
            "text": "哈勃常数约为每秒每百万秒差距 70 公里。",
            "formula": "H_0 \\approx 70\\,\\text{km/s/Mpc}"
          },
          {
            "text": "速度对距离的图是一条直线，斜率就是哈勃常数。"
          },
          {
            "text": "哈勃常数的倒数，粗略给出宇宙的年龄，约 138 亿年。",
            "formula": "t \\approx \\dfrac{1}{H_0}"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调节哈勃常数，观察速度-距离直线斜率的变化。"
          },
          {
            "text": "选择不同距离的星系，读出它的退行速度和红移量。"
          },
          {
            "text": "注意越远的星系，红移越大、退行越快。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "哈勃定律是测量遥远星系距离的重要标尺。"
          },
          {
            "text": "它支持了宇宙大爆炸理论，并能估算宇宙的年龄。"
          },
          {
            "text": "现代观测发现宇宙在加速膨胀，背后是神秘的暗能量。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "星系普遍红移，退行速度与距离成正比，即哈勃定律 v=H₀d。"
          },
          {
            "text": "它揭示了宇宙正在膨胀，是空间本身在拉伸。"
          },
          {
            "text": "哈勃常数的倒数还能估算宇宙年龄。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "宇宙大爆炸",
        "description": "膨胀回溯到的起点"
      },
      {
        "title": "暗能量与加速膨胀",
        "description": "哈勃常数的现代测量"
      }
    ]
  },
  {
    "slug": "hr-diagram",
    "title": "恒星赫罗图",
    "subtitle": "温度与光度绘出恒星的一生",
    "category": "天体物理",
    "difficulty": "intermediate",
    "targetAge": "16-17岁",
    "sourcePath": "/hr-diagram",
    "sourceChunk": "HRDiagramExperiment-BZwJ4pxO.js",
    "objectives": [
      "理解恒星的温度、颜色与光度关系",
      "认识主序带、巨星与白矮星",
      "掌握斯特藩-玻尔兹曼定律"
    ],
    "prerequisites": [
      "黑体辐射",
      "光度与亮度",
      "恒星演化"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到赫罗图！它是天文学家理解恒星的最重要工具之一。"
          },
          {
            "text": "把每颗恒星的温度和亮度画成一个点，就得到了这张恒星地图。"
          },
          {
            "text": "恒星并非随意散布，而是聚集成清晰的带状和分支。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "横轴是表面温度，注意它从右到左递增，这是历史惯例。"
          },
          {
            "text": "纵轴是光度，也就是恒星每秒辐射的总能量。"
          },
          {
            "text": "大多数恒星落在从左上到右下的一条带上，叫主序带。"
          },
          {
            "text": "右上是又大又亮的红巨星，左下是又小又暗的白矮星。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "恒星的光度由表面积和温度四次方共同决定。",
            "formula": "L = 4\\pi R^2 \\sigma T^4"
          },
          {
            "text": "温度越高，单位面积辐射越强，与温度的四次方成正比。"
          },
          {
            "text": "同样温度下，半径越大，光度越高，所以巨星格外明亮。"
          },
          {
            "text": "恒星的颜色也由温度决定：蓝色最热，红色最凉。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调节恒星的温度和半径，看它在图上落到哪个区域。"
          },
          {
            "text": "尝试把它放到主序带、红巨星区或白矮星区。"
          },
          {
            "text": "观察恒星颜色随温度从红到蓝的变化。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "赫罗图帮助天文学家判断恒星处于一生中的哪个阶段。"
          },
          {
            "text": "由恒星在主序带的位置，可以估算它的质量和寿命。"
          },
          {
            "text": "它还是测量星团距离与年龄的关键工具。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "赫罗图以温度为横轴、光度为纵轴，描绘恒星的分布。"
          },
          {
            "text": "主序带、红巨星、白矮星各占一方，反映演化阶段。"
          },
          {
            "text": "光度由 L=4πR²σT⁴ 决定。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "恒星演化轨迹",
        "description": "恒星在 HR 图上的一生"
      },
      {
        "title": "光谱分类 OBAFGKM",
        "description": "恒星颜色与温度"
      }
    ]
  },
  {
    "slug": "double-pendulum",
    "title": "双摆与混沌",
    "subtitle": "简单系统中涌现的确定性混沌",
    "category": "非线性动力学",
    "difficulty": "advanced",
    "targetAge": "16-18岁",
    "sourcePath": "/double-pendulum",
    "sourceChunk": "DoublePendulumExperiment-CvdPE0Z9.js",
    "objectives": [
      "理解双摆的耦合非线性运动",
      "认识确定性混沌与初值敏感性",
      "体会蝴蝶效应的物理含义"
    ],
    "prerequisites": [
      "单摆",
      "能量守恒",
      "微分方程基础"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到双摆实验！只是在单摆下面再挂一个摆，运动就变得难以预测。"
          },
          {
            "text": "它会翻转、甩动，划出眼花缭乱的轨迹，几乎看不出任何规律。"
          },
          {
            "text": "可它明明遵循确定的物理定律。这正是混沌的奇妙之处。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "双摆由两根摆杆和两个摆球组成，第二个摆挂在第一个摆的末端。"
          },
          {
            "text": "两个摆通过连接点相互耦合，一个的运动会强烈影响另一个。"
          },
          {
            "text": "它的运动方程是一组耦合的非线性微分方程，没有简单的解析解。"
          },
          {
            "text": "在大摆角下，双摆表现出确定性混沌：规律确定，行为却不可预测。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "虽然系统完全由牛顿定律决定，但方程高度非线性、相互耦合。"
          },
          {
            "text": "混沌的核心特征是对初始条件的极端敏感。"
          },
          {
            "text": "两个初始角度只差千分之一的双摆，很快就会走上完全不同的轨迹。",
            "formula": "\\delta\\theta(t) \\sim \\delta\\theta_0\\, e^{\\lambda t}"
          },
          {
            "text": "其中 λ 是李雅普诺夫指数，它大于零，正是混沌的标志。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "观察画面中两个仅有微小初始差别的双摆，用不同颜色表示。"
          },
          {
            "text": "起初它们几乎重合，但很快就分道扬镳，这就是蝴蝶效应。"
          },
          {
            "text": "调整初始角度，感受双摆轨迹的千变万化。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "混沌理论解释了为什么长期天气预报如此困难。"
          },
          {
            "text": "从心跳节律到行星轨道，混沌现象广泛存在于自然界。"
          },
          {
            "text": "理解混沌，帮助我们认识复杂系统的可预测边界。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "双摆是耦合非线性系统，在大摆角下表现出确定性混沌。"
          },
          {
            "text": "混沌的核心是对初值的极端敏感，微小差别指数级放大。"
          },
          {
            "text": "确定的定律未必带来可预测的未来。这是混沌给我们的深刻启示。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "蝴蝶效应",
        "description": "洛伦兹与混沌理论的起源"
      },
      {
        "title": "李雅普诺夫指数",
        "description": "量化混沌系统的发散速度"
      }
    ]
  },
  {
    "slug": "lorenz-attractor",
    "title": "洛伦兹吸引子",
    "subtitle": "混沌理论的标志性蝴蝶",
    "category": "非线性动力学",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/lorenz-attractor",
    "sourceChunk": "LorenzAttractorExperiment-DwUkmfqn.js",
    "objectives": [
      "理解洛伦兹方程组与奇异吸引子",
      "认识混沌系统的有界而非周期行为",
      "体会确定性系统的不可预测性"
    ],
    "prerequisites": [
      "微分方程",
      "相空间",
      "混沌初步"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到洛伦兹吸引子实验！1963 年，气象学家洛伦兹在简化的天气模型中有了惊人发现。"
          },
          {
            "text": "一组只有三个变量的简单方程，却产生了永不重复、却又始终有界的轨迹。"
          },
          {
            "text": "这条轨迹形如展翅的蝴蝶，成为混沌理论最著名的图腾。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "洛伦兹方程描述了三个变量随时间的相互影响，源自对流的简化模型。"
          },
          {
            "text": "轨迹在三维相空间中演化，永远不会自我相交，也永远不重复。"
          },
          {
            "text": "但它始终被吸引在一个有限的区域内，这就是奇异吸引子。"
          },
          {
            "text": "轨迹绕着两个中心来回缠绕，何时切换却无法预测。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "第一个方程描述 x 向 y 的趋近，σ 是普朗特数。",
            "formula": "\\dot{x} = \\sigma(y - x)"
          },
          {
            "text": "第二个方程包含非线性项 xz，ρ 是瑞利数。",
            "formula": "\\dot{y} = x(\\rho - z) - y"
          },
          {
            "text": "第三个方程同样含有非线性项 xy，β 是几何因子。",
            "formula": "\\dot{z} = xy - \\beta z"
          },
          {
            "text": "经典参数 σ=10、ρ=28、β=8/3 时，系统进入混沌状态。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "观察轨迹如何在两个翼之间来回缠绕，画出蝴蝶的形状。"
          },
          {
            "text": "调整瑞利数 ρ，看系统从稳定走向混沌。"
          },
          {
            "text": "ρ 较小时轨迹收敛到定点，增大后才出现混沌的蝴蝶。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "洛伦兹的发现催生了整个混沌理论，深刻影响了气象、流体和工程。"
          },
          {
            "text": "它解释了为什么超过两周的天气预报几乎不可能准确。"
          },
          {
            "text": "混沌系统还被应用于保密通信和随机数生成。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "洛伦兹吸引子来自三个简单的非线性方程。"
          },
          {
            "text": "它的轨迹有界、不重复、不相交，是奇异吸引子的典范。"
          },
          {
            "text": "从一个天气模型，人类窥见了混沌的深邃之美。希望你已被这只蝴蝶打动！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "气象学与混沌",
        "description": "洛伦兹如何从天气模型发现混沌"
      },
      {
        "title": "奇异吸引子",
        "description": "分形维数与相空间结构"
      }
    ]
  },
  {
    "slug": "logistic-map",
    "title": "逻辑斯蒂分岔图",
    "subtitle": "通向混沌的倍周期之路",
    "category": "非线性动力学",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/logistic-map",
    "sourceChunk": "LogisticMapExperiment-JZDAQM9t.js",
    "objectives": [
      "理解逻辑斯蒂映射的迭代行为",
      "认识倍周期分岔通向混沌的过程",
      "了解费根鲍姆常数的普适性"
    ],
    "prerequisites": [
      "迭代与数列",
      "不动点",
      "混沌初步"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到逻辑斯蒂分岔图实验！一个看似简单的公式，竟能展现从秩序到混沌的全过程。"
          },
          {
            "text": "它最初用来描述生物种群的增长，却意外揭示了混沌的普适规律。"
          },
          {
            "text": "今天我们就来绘制这幅著名的分岔图，看混沌是如何一步步降临的。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "逻辑斯蒂映射是一个迭代公式，每一代的数值由上一代决定。"
          },
          {
            "text": "参数 r 代表增长率，它的大小决定了系统的长期命运。"
          },
          {
            "text": "r 较小时，系统稳定到一个固定值；增大后会在两个值之间来回跳动。"
          },
          {
            "text": "继续增大 r，周期不断翻倍，最终陷入永不重复的混沌。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "逻辑斯蒂映射的迭代公式非常简洁。",
            "formula": "x_{n+1} = r\\,x_n(1 - x_n)"
          },
          {
            "text": "当 r 小于 3 时，迭代收敛到单一不动点，系统稳定。"
          },
          {
            "text": "r 超过 3 后发生倍周期分岔，2 周期、4 周期、8 周期接连出现。"
          },
          {
            "text": "约在 r 等于 3.57 时进入混沌。相邻分岔间距之比趋于费根鲍姆常数 4.669。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "观察分岔图，横轴是参数 r，纵轴是系统稳定后的取值。"
          },
          {
            "text": "拖动红线扫描 r，看左侧迭代从单值分裂为两值、四值。"
          },
          {
            "text": "当 r 进入混沌区，取值布满一片区域，但其中仍藏有周期窗口。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "逻辑斯蒂映射最初用于描述昆虫种群的世代变化。"
          },
          {
            "text": "它揭示的倍周期分岔规律，在流体、电路、化学反应中普遍存在。"
          },
          {
            "text": "费根鲍姆常数的普适性，是混沌理论最深刻的发现之一。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "逻辑斯蒂映射通过简单迭代，展现倍周期分岔通向混沌。"
          },
          {
            "text": "r 超过 3 开始分岔，约 3.57 进入混沌，分岔间距比趋于 4.669。"
          },
          {
            "text": "简单的规则，复杂的命运。这正是非线性世界的魅力。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "费根鲍姆常数",
        "description": "分岔间距比值的普适常数 4.669"
      },
      {
        "title": "种群动力学",
        "description": "逻辑斯蒂映射的生态学起源"
      }
    ]
  },
  {
    "slug": "van-der-pol",
    "title": "范德波尔振子",
    "subtitle": "非线性阻尼下的自激振荡与极限环",
    "category": "非线性动力学",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/van-der-pol",
    "sourceChunk": "VanDerPolExperiment-C6uYwd_f.js",
    "objectives": [
      "理解非线性阻尼与自激振荡",
      "认识相空间中的极限环",
      "体会松弛振荡的产生机制"
    ],
    "prerequisites": [
      "简谐振动",
      "阻尼振动",
      "相空间"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到范德波尔振子实验！普通的摆动会因摩擦逐渐停下，但有些振动却能自己维持。"
          },
          {
            "text": "心跳、萤火虫的闪烁、电子管振荡器，都属于这种自激振荡。"
          },
          {
            "text": "范德波尔振子正是描述这类现象的经典模型，它的秘密藏在非线性阻尼里。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "普通阻尼总是消耗能量，让振动衰减。而范德波尔振子的阻尼会随振幅变化。"
          },
          {
            "text": "当振幅小时，阻尼为负，向系统注入能量，振动增强。"
          },
          {
            "text": "当振幅大时，阻尼为正，消耗能量，振动减弱。"
          },
          {
            "text": "两者平衡之下，系统最终稳定在一个固定的振荡上，称为极限环。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "范德波尔方程的形式如下，关键是那个随 x 平方变化的阻尼项。",
            "formula": "\\ddot{x} - \\mu(1 - x^2)\\dot{x} + x = 0"
          },
          {
            "text": "参数 μ 控制非线性的强弱，μ 越大，非线性效应越显著。"
          },
          {
            "text": "在相空间里，无论从哪里出发，轨迹最终都会被吸引到同一个闭合曲线上。"
          },
          {
            "text": "这个闭合曲线就是极限环，它代表系统稳定的自激振荡。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "观察相空间中的轨迹，从中心螺旋向外，最终锁定在极限环上。"
          },
          {
            "text": "增大参数 μ，极限环变形，波形从近似正弦变为松弛振荡。"
          },
          {
            "text": "松弛振荡有缓慢积累、快速释放的特征，像是一次次的脉冲。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "范德波尔方程最初用于描述电子管振荡电路。"
          },
          {
            "text": "它也是心脏起搏、神经元放电等生物节律的简化模型。"
          },
          {
            "text": "极限环概念广泛用于分析各种自持振荡系统的稳定性。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "范德波尔振子靠非线性阻尼维持自激振荡。"
          },
          {
            "text": "小振幅注入能量、大振幅消耗能量，系统稳定在极限环上。"
          },
          {
            "text": "μ 越大越接近松弛振荡。极限环是非线性系统的迷人特征。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "心脏起搏与极限环",
        "description": "生物节律中的自激振荡"
      },
      {
        "title": "电子振荡电路",
        "description": "范德波尔方程的工程起源"
      }
    ]
  },
  {
    "slug": "chua-circuit",
    "title": "蔡氏电路",
    "subtitle": "最简单的混沌电子电路",
    "category": "非线性动力学",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/chua-circuit",
    "sourceChunk": "ChuaCircuitExperiment-BE9I2Zn5.js",
    "objectives": [
      "理解蔡氏电路的非线性元件",
      "认识双涡卷混沌吸引子",
      "体会电子系统中的确定性混沌"
    ],
    "prerequisites": [
      "RLC 电路",
      "非线性电阻",
      "混沌初步"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到蔡氏电路实验！混沌不只存在于天气和双摆，简单的电路也能产生混沌。"
          },
          {
            "text": "1983 年，蔡少棠设计出一个仅含几个元件的电路，却能产生丰富的混沌行为。"
          },
          {
            "text": "它是第一个被严格证明会出现混沌的物理电路，至今仍是研究混沌的典范。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "蔡氏电路由两个电容、一个电感、一个电阻和一个非线性元件组成。"
          },
          {
            "text": "这个非线性元件叫蔡氏二极管，它的伏安特性是分段线性的。"
          },
          {
            "text": "正是这个非线性，让电路的电压和电流不再周期重复，而是混沌演化。"
          },
          {
            "text": "在相空间中，轨迹绕着两个中心来回缠绕，形成双涡卷吸引子。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "蔡氏电路的无量纲方程组如下，x、y、z 对应电压和电流。",
            "formula": "\\dot{x} = \\alpha(y - x - f(x))"
          },
          {
            "text": "第二、三个方程描述各变量的耦合。",
            "formula": "\\dot{y} = x - y + z,\\quad \\dot{z} = -\\beta y"
          },
          {
            "text": "f(x) 是蔡氏二极管的分段线性特性，提供必要的非线性。"
          },
          {
            "text": "调整参数 α、β，系统会在周期与混沌之间转变。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "观察相空间投影，轨迹在两个涡卷之间反复跳转。"
          },
          {
            "text": "调整参数 α，看系统从稳定的极限环走向混沌的双涡卷。"
          },
          {
            "text": "何时从一个涡卷跳到另一个，是完全不可预测的。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "蔡氏电路是研究混沌最方便的实验平台，可在实验室轻松搭建。"
          },
          {
            "text": "它被用于混沌保密通信，将信息隐藏在混沌信号中。"
          },
          {
            "text": "混沌电路还用于随机数生成和复杂系统的教学演示。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "蔡氏电路是最简单的混沌电子电路，核心是非线性的蔡氏二极管。"
          },
          {
            "text": "它的相空间轨迹形成双涡卷吸引子，在两个中心间不可预测地跳转。"
          },
          {
            "text": "简单电路也能孕育混沌，这是非线性世界的又一例证。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "蔡氏二极管",
        "description": "产生混沌所需的非线性电阻"
      },
      {
        "title": "混沌保密通信",
        "description": "利用电路混沌加密信号"
      }
    ]
  },
  {
    "slug": "duffing-oscillator",
    "title": "达芬振子",
    "subtitle": "非线性弹簧的受迫振动与混沌",
    "category": "非线性动力学",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/duffing-oscillator",
    "sourceChunk": "DuffingOscillatorExperiment-B3Kc9LFi.js",
    "objectives": [
      "理解非线性弹簧的恢复力",
      "认识达芬方程与双势阱",
      "体会受迫非线性振动的混沌"
    ],
    "prerequisites": [
      "受迫振动",
      "相空间",
      "混沌初步"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到达芬振子实验！普通弹簧的恢复力与位移成正比，但很多真实系统并非如此。"
          },
          {
            "text": "当恢复力含有位移的立方项，系统就变成了非线性的达芬振子。"
          },
          {
            "text": "在周期驱动下，它能展现出令人惊叹的混沌行为。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "达芬振子的恢复力包含线性项和立方项两部分。"
          },
          {
            "text": "当立方项系数为负、线性项为负时，系统有两个稳定平衡点，形成双势阱。"
          },
          {
            "text": "在周期外力驱动下，振子可能在两个势阱间来回跳跃。"
          },
          {
            "text": "何时跳跃变得不可预测，这正是混沌的标志。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "达芬方程包含阻尼、线性恢复、非线性恢复和驱动四项。",
            "formula": "\\ddot{x} + \\delta\\dot{x} + \\alpha x + \\beta x^3 = \\gamma\\cos\\omega t"
          },
          {
            "text": "其中 δ 是阻尼，β 是非线性系数，γ 是驱动幅度，ω 是驱动频率。"
          },
          {
            "text": "当 α 为负、β 为正时，势能呈双阱形状。"
          },
          {
            "text": "增大驱动幅度，系统会从规则振动逐渐走向混沌。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "观察相空间轨迹，看振子在两个势阱间的运动。"
          },
          {
            "text": "增大驱动幅度 γ，轨迹从简单环变得错综复杂。"
          },
          {
            "text": "在混沌区，轨迹永不重复，填满相空间的一片区域。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "达芬方程描述了许多真实的非线性振动系统，如屈曲梁的振动。"
          },
          {
            "text": "它是研究混沌、分岔和非线性共振的经典模型。"
          },
          {
            "text": "在工程上，理解非线性振动有助于避免结构的危险共振。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "达芬振子是含立方非线性项的受迫振动系统。"
          },
          {
            "text": "双势阱结构下，增大驱动会让系统从规则走向混沌。"
          },
          {
            "text": "它是非线性动力学的经典范例。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "硬弹簧与软弹簧",
        "description": "非线性刚度的频率响应"
      },
      {
        "title": "庞加莱截面",
        "description": "识别混沌的工具"
      }
    ]
  },
  {
    "slug": "pendulum-phase",
    "title": "单摆相图",
    "subtitle": "相空间中的振动、旋转与分界线",
    "category": "非线性动力学",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/pendulum-phase",
    "sourceChunk": "PendulumPhaseExperiment-CX3p4VRi.js",
    "objectives": [
      "理解相空间与相轨迹",
      "区分单摆的振动与旋转模式",
      "认识分界线与能量的关系"
    ],
    "prerequisites": [
      "单摆",
      "能量守恒",
      "相空间"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到单摆相图实验！我们熟悉单摆来回摆动，但如果把它的运动画在相空间里会怎样？"
          },
          {
            "text": "相空间用角度和角速度两个坐标，完整描述系统的状态。"
          },
          {
            "text": "在相空间里，单摆的不同运动会画出形态各异的轨迹，揭示深层规律。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "相空间的横轴是摆角，纵轴是角速度。"
          },
          {
            "text": "小振幅摆动在相空间里是一个近似椭圆的闭合曲线。"
          },
          {
            "text": "能量较低时单摆来回振动，轨迹是闭合的；能量足够高时单摆翻转旋转，轨迹不再闭合。"
          },
          {
            "text": "分隔这两种运动的特殊轨迹，叫做分界线。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "单摆的运动方程是非线性的。",
            "formula": "\\ddot{\\theta} + \\frac{g}{L}\\sin\\theta = 0"
          },
          {
            "text": "系统的总能量在相空间中守恒，决定了轨迹的形状。",
            "formula": "E = \\frac{1}{2}\\dot{\\theta}^2 - \\frac{g}{L}\\cos\\theta"
          },
          {
            "text": "能量低于临界值时单摆振动，高于临界值时旋转。"
          },
          {
            "text": "恰好等于临界能量的轨迹，就是分界线，对应单摆勉强到达最高点。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调整初始能量，观察相轨迹从闭合的振动环变为开放的旋转曲线。"
          },
          {
            "text": "小能量时轨迹接近椭圆，对应简谐振动。"
          },
          {
            "text": "当能量跨过分界线，单摆开始一圈圈旋转，不再回头。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "相图是分析一切动力系统的强大工具。"
          },
          {
            "text": "从电路振荡到天体运动，相空间方法无处不在。"
          },
          {
            "text": "在受扰单摆中，分界线附近正是混沌最容易出现的地方。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "相空间用角度和角速度描述单摆状态，轨迹由总能量决定。"
          },
          {
            "text": "低能量振动画闭合环，高能量旋转画开放线，分界线分隔两者。"
          },
          {
            "text": "相图是理解动力系统的通用语言。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "哈密顿力学",
        "description": "相空间中的能量守恒轨迹"
      },
      {
        "title": "分界线与混沌",
        "description": "受扰单摆的混沌之源"
      }
    ]
  },
  {
    "slug": "mandelbrot",
    "title": "曼德博集合",
    "subtitle": "简单迭代生成的无穷分形",
    "category": "非线性动力学",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/mandelbrot",
    "sourceChunk": "MandelbrotExperiment-Bp4A10Xt.js",
    "objectives": [
      "理解复平面上的迭代映射",
      "认识曼德博集合的定义",
      "体会分形的自相似与无穷复杂"
    ],
    "prerequisites": [
      "复数",
      "迭代",
      "逻辑斯蒂分岔"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到曼德博集合实验！这是数学中最著名、最美丽的图形之一。"
          },
          {
            "text": "它由一个极其简单的公式生成，却展现出无穷无尽的复杂细节。"
          },
          {
            "text": "无论放大多少倍，你总能发现新的精致结构，这就是分形的魅力。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "曼德博集合定义在复平面上，每个点对应一个复数 c。"
          },
          {
            "text": "我们从零开始，反复应用映射 z 变成 z 平方加 c。"
          },
          {
            "text": "如果迭代结果始终保持有界，这个点 c 就属于曼德博集合，通常涂成黑色。"
          },
          {
            "text": "如果迭代发散到无穷，就根据它逃逸的快慢染上不同颜色。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "核心迭代公式简洁得令人难以置信。",
            "formula": "z_{n+1} = z_n^2 + c"
          },
          {
            "text": "其中 z 和 c 都是复数，初始 z 为零。"
          },
          {
            "text": "当 z 的模超过 2，迭代必然发散，可以提前判定逃逸。"
          },
          {
            "text": "逃逸所需的迭代次数，决定了该点的颜色，绘出绚丽的边界。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "放大集合的边界区域，观察永不重复的精细花纹。"
          },
          {
            "text": "调整最大迭代次数，看边界细节如何变得更清晰。"
          },
          {
            "text": "注意边界处的自相似：局部结构与整体惊人地相似。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "分形几何用于描述海岸线、山脉、云朵等自然形态。"
          },
          {
            "text": "它在图像压缩、计算机图形和艺术创作中都有应用。"
          },
          {
            "text": "曼德博集合也与混沌理论、复动力系统紧密相连。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "曼德博集合由迭代 z 等于 z 平方加 c 定义。"
          },
          {
            "text": "有界的点属于集合，发散的点按逃逸速度染色。"
          },
          {
            "text": "简单的规则孕育无穷的复杂，这是分形与混沌的共同主题。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "朱利亚集合",
        "description": "与曼德博集合互补的分形"
      },
      {
        "title": "分形维数",
        "description": "介于整数之间的维度"
      }
    ]
  },
  {
    "slug": "kdv-soliton",
    "title": "KdV 孤立波",
    "subtitle": "永不消散的孤独波包",
    "category": "非线性动力学",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/kdv-soliton",
    "sourceChunk": "KdVSolitonExperiment-DU89qcwk.js",
    "objectives": [
      "理解非线性与色散的平衡",
      "认识孤立子的稳定传播",
      "了解孤立波的碰撞特性"
    ],
    "prerequisites": [
      "波的传播",
      "色散",
      "非线性方程"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到孤立波！1834 年，罗素在运河边骑马追逐一个奇特的水包。"
          },
          {
            "text": "它独自前行数公里，形状几乎不变，这就是孤立波。"
          },
          {
            "text": "它由 KdV 方程描述，是非线性物理的明珠。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "普通波包会因色散而逐渐展宽、消散。"
          },
          {
            "text": "而非线性效应会让波包变陡、聚拢。"
          },
          {
            "text": "当色散与非线性恰好平衡，波包就稳定不变了。"
          },
          {
            "text": "这种稳定的孤立波又叫孤立子，能保持形状长距离传播。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "KdV 方程同时包含非线性项和色散项。",
            "formula": "u_t + 6uu_x + u_{xxx} = 0"
          },
          {
            "text": "它的孤立波解是一个双曲正割平方的波包。",
            "formula": "u = \\tfrac{c}{2}\\,\\mathrm{sech}^2\\!\\Big(\\tfrac{\\sqrt{c}}{2}(x-ct)\\Big)"
          },
          {
            "text": "振幅越高的孤立波传播越快，也越窄。"
          },
          {
            "text": "两个孤立波相撞后，竟能各自完好地穿出。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调节波速，观察孤立波振幅与宽度的联动。"
          },
          {
            "text": "让波包传播，看它形状保持不变。"
          },
          {
            "text": "体会高振幅孤立波又高又窄又快的特征。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "光纤孤立子能在长距离通信中保持脉冲不失真。"
          },
          {
            "text": "海洋中的内波、浅水波也常以孤立波形式出现。"
          },
          {
            "text": "孤立子理论深刻影响了现代非线性科学。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "孤立波是色散与非线性平衡的产物，形状稳定。"
          },
          {
            "text": "KdV 方程的 sech² 解描述了它，振幅越大越快越窄。"
          },
          {
            "text": "从运河到光纤，孤立子无处不在。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "罗素的发现",
        "description": "运河上追逐孤立波的故事"
      },
      {
        "title": "光纤孤立子",
        "description": "通信中的孤立波应用"
      }
    ]
  },
  {
    "slug": "henon-map",
    "title": "埃农映射",
    "subtitle": "简单迭代生成的奇异吸引子",
    "category": "非线性动力学",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/henon-map",
    "sourceChunk": "HenonMapExperiment-y_hN3cZs.js",
    "objectives": [
      "理解离散动力系统迭代",
      "认识奇异吸引子的分形结构",
      "体会确定性混沌"
    ],
    "prerequisites": [
      "迭代映射",
      "混沌",
      "分形"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到埃农映射！只用两个简单公式反复迭代，竟能画出精妙的图案。"
          },
          {
            "text": "这些点不会填满平面，而是聚成一条卷曲的细带。"
          },
          {
            "text": "它叫奇异吸引子，是确定性混沌的经典代表。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "埃农映射是一个离散动力系统，每一步由上一步算出下一步。"
          },
          {
            "text": "不论从哪个初始点出发，迭代后都会落到同一个吸引子上。"
          },
          {
            "text": "放大吸引子，会看到无穷嵌套的层状结构，这是分形。"
          },
          {
            "text": "系统完全确定，却对初值极其敏感，体现了混沌。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "埃农映射的迭代公式如下。",
            "formula": "x_{n+1}=1-ax_n^2+y_n"
          },
          {
            "text": "第二个分量只是对前一个 x 的缩放。",
            "formula": "y_{n+1}=bx_n"
          },
          {
            "text": "经典参数取 a=1.4、b=0.3，产生著名的吸引子。"
          },
          {
            "text": "改变参数，吸引子会在有序与混沌之间切换。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调节参数 a，观察吸引子形状的剧烈变化。"
          },
          {
            "text": "改变参数 b，看吸引子的拉伸与折叠。"
          },
          {
            "text": "在经典值附近，欣赏那条标志性的弯月形吸引子。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "埃农映射是研究混沌与分形的标准模型。"
          },
          {
            "text": "它帮助科学家理解非线性系统的长期行为。"
          },
          {
            "text": "类似的迭代思想也用于伪随机数与加密。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "埃农映射用两个简单公式迭代出奇异吸引子。"
          },
          {
            "text": "吸引子具有分形结构，系统是确定性混沌。"
          },
          {
            "text": "它是非线性动力学的经典范例。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "奇异吸引子",
        "description": "混沌系统的几何骨架"
      },
      {
        "title": "分形维数",
        "description": "吸引子的非整数维度"
      }
    ]
  },
  {
    "slug": "qubit-bloch",
    "title": "量子比特与布洛赫球",
    "subtitle": "用一个球面表示量子的叠加态",
    "category": "量子信息",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/qubit-bloch",
    "sourceChunk": "QubitBlochExperiment-CK3tvKqQ.js",
    "objectives": [
      "理解量子比特的叠加态",
      "掌握布洛赫球的几何表示",
      "认识测量导致的坍缩"
    ],
    "prerequisites": [
      "复数",
      "概率",
      "量子叠加"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎进入量子世界！经典比特只能是 0 或 1，量子比特却能同时是两者。"
          },
          {
            "text": "这种神奇的叠加态，可以用一个球面上的点来直观表示。"
          },
          {
            "text": "这个球，就是布洛赫球——量子比特的地图。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "球的北极代表状态 0，南极代表状态 1。"
          },
          {
            "text": "球面上的任意一点，都是 0 和 1 的某种叠加。"
          },
          {
            "text": "极角 θ 决定 0 与 1 的比重，方位角 φ 决定它们之间的相位。"
          },
          {
            "text": "一旦测量，量子比特就随机坍缩到北极或南极。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "量子比特的一般态由 θ 和 φ 描述。",
            "formula": "|\\psi\\rangle = \\cos\\tfrac{\\theta}{2}|0\\rangle + e^{i\\varphi}\\sin\\tfrac{\\theta}{2}|1\\rangle"
          },
          {
            "text": "测得 0 的概率是 cos² (θ/2)。",
            "formula": "P(0) = \\cos^2\\tfrac{\\theta}{2}"
          },
          {
            "text": "测得 1 的概率是 sin² (θ/2)，两者之和为 1。",
            "formula": "P(1) = \\sin^2\\tfrac{\\theta}{2}"
          },
          {
            "text": "赤道上的点是均等叠加，测 0 和测 1 各占一半。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "拖动极角 θ，观察态矢量从北极转向南极。"
          },
          {
            "text": "改变方位角 φ，看相位如何绕赤道旋转。"
          },
          {
            "text": "注意测量概率随极角的连续变化。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "布洛赫球是理解量子计算的基础工具。"
          },
          {
            "text": "量子门的作用，就是让态矢量在球面上旋转。"
          },
          {
            "text": "量子比特的叠加，是量子计算强大并行能力的源泉。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "量子比特是 0 和 1 的叠加，用布洛赫球上的点表示。"
          },
          {
            "text": "极角决定测量概率，方位角决定相位。"
          },
          {
            "text": "测量使它随机坍缩到 0 或 1。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "量子叠加",
        "description": "既是0又是1"
      },
      {
        "title": "量子测量",
        "description": "观测导致坍缩"
      }
    ]
  },
  {
    "slug": "quantum-gates",
    "title": "量子逻辑门",
    "subtitle": "让量子比特在球面上旋转",
    "category": "量子信息",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/quantum-gates",
    "sourceChunk": "QuantumGatesExperiment-HI0_xCv8.js",
    "objectives": [
      "理解量子门是幺正旋转",
      "掌握 X/H/Z 门的作用",
      "认识与经典逻辑门的区别"
    ],
    "prerequisites": [
      "量子比特",
      "布洛赫球",
      "矩阵"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到量子门！它是量子计算机里操作量子比特的基本单元。"
          },
          {
            "text": "和经典逻辑门不同，量子门让态矢量在布洛赫球上旋转。"
          },
          {
            "text": "几个基本量子门组合起来，就能完成任意量子计算。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "X 门相当于经典的非门，把 0 和 1 互换，即绕 X 轴翻转 180 度。"
          },
          {
            "text": "Z 门给状态 1 加一个负相位，是绕 Z 轴旋转 180 度。"
          },
          {
            "text": "阿达马门 H 把确定态变成均等叠加态，是量子并行的开关。"
          },
          {
            "text": "所有量子门都是可逆的幺正变换，保持态矢量长度不变。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "X 门的矩阵交换 0 与 1。",
            "formula": "X = \\begin{pmatrix}0&1\\\\1&0\\end{pmatrix}"
          },
          {
            "text": "阿达马门制造叠加。",
            "formula": "H = \\tfrac{1}{\\sqrt2}\\begin{pmatrix}1&1\\\\1&-1\\end{pmatrix}"
          },
          {
            "text": "H 作用于 0，得到 0 与 1 的均等叠加。",
            "formula": "H|0\\rangle = \\tfrac{1}{\\sqrt2}(|0\\rangle+|1\\rangle)"
          },
          {
            "text": "连续作用两次 H 会回到原态，体现量子门的可逆性。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "依次点击 X、H、Z 门，观察态矢量在球面上的旋转。"
          },
          {
            "text": "试试对 0 态作用 H 门，看它跳到赤道变成叠加态。"
          },
          {
            "text": "连续作用同一个门两次，验证它回到初始态。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "量子算法本质上就是精心设计的一串量子门。"
          },
          {
            "text": "阿达马门是 Grover 搜索和 Shor 分解算法的起点。"
          },
          {
            "text": "真实量子计算机用微波或激光脉冲实现这些门。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "量子门是作用在量子比特上的幺正旋转。"
          },
          {
            "text": "X 门翻转、Z 门加相位、H 门制造叠加。"
          },
          {
            "text": "它们是量子计算的基本积木。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "阿达马门",
        "description": "制造叠加态的关键"
      },
      {
        "title": "通用量子门",
        "description": "任意量子计算的积木"
      }
    ]
  },
  {
    "slug": "quantum-entanglement",
    "title": "量子纠缠与贝尔态",
    "subtitle": "两个粒子的命运纠缠在一起",
    "category": "量子信息",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/quantum-entanglement",
    "sourceChunk": "QuantumEntanglementExperiment-BKCa25ua.js",
    "objectives": [
      "理解量子纠缠的非定域关联",
      "认识贝尔态",
      "了解纠缠在量子通信中的作用"
    ],
    "prerequisites": [
      "量子比特",
      "量子叠加",
      "量子测量"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎认识量子纠缠！爱因斯坦称它为鬼魅般的超距作用。"
          },
          {
            "text": "两个纠缠的粒子，无论相隔多远，测量结果都瞬间关联。"
          },
          {
            "text": "测一个，另一个的状态立刻确定，这违反我们的日常直觉。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "纠缠态无法拆成两个独立粒子各自的状态。"
          },
          {
            "text": "最著名的纠缠态是贝尔态，两个比特要么都是 0，要么都是 1。"
          },
          {
            "text": "测量前，每个粒子单独看都是完全随机的。"
          },
          {
            "text": "一旦测出一个是 0，另一个不管多远也必然是 0。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "贝尔态是两个比特的均等叠加。",
            "formula": "|\\Phi^+\\rangle = \\tfrac{1}{\\sqrt2}(|00\\rangle + |11\\rangle)"
          },
          {
            "text": "测得 00 和测得 11 各占一半概率。",
            "formula": "P(00) = P(11) = \\tfrac{1}{2}"
          },
          {
            "text": "但绝不会出现 01 或 10，这就是关联。",
            "formula": "P(01) = P(10) = 0"
          },
          {
            "text": "这种关联强于任何经典模型，由贝尔不等式的破坏所证实。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "反复点击测量，观察两个粒子总是给出相同结果。"
          },
          {
            "text": "统计多次测量，验证 00 与 11 各约一半。"
          },
          {
            "text": "注意单看一个粒子是随机的，但两者完全同步。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "量子纠缠是量子隐形传态和量子密钥分发的核心资源。"
          },
          {
            "text": "我国的墨子号卫星用纠缠实现了千公里级量子通信。"
          },
          {
            "text": "纠缠也是量子计算超越经典的关键所在。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "量子纠缠让两个粒子的测量结果强关联，无法独立描述。"
          },
          {
            "text": "贝尔态只给出 00 或 11，各占一半，绝不出现 01 或 10。"
          },
          {
            "text": "它是量子通信与量子计算的基石。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "爱因斯坦的鬼魅作用",
        "description": "EPR 佯谬"
      },
      {
        "title": "量子隐形传态",
        "description": "纠缠的应用"
      }
    ]
  },
  {
    "slug": "schrodinger-cat",
    "title": "薛定谔的猫",
    "subtitle": "叠加态与测量的思想实验",
    "category": "量子信息",
    "difficulty": "intermediate",
    "targetAge": "16-17岁",
    "sourcePath": "/schrodinger-cat",
    "sourceChunk": "SchrodingerCatExperiment-BtY6VIU_.js",
    "objectives": [
      "理解宏观叠加态的悖论",
      "认识测量导致坍缩",
      "体会量子与经典的边界"
    ],
    "prerequisites": [
      "量子叠加",
      "量子测量",
      "放射性衰变"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到最著名的思想实验——薛定谔的猫！"
          },
          {
            "text": "一只猫被关在盒子里，命运与一个量子事件绑定。"
          },
          {
            "text": "在打开盒子之前，这只猫竟然处于既死又活的叠加态。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "盒子里有放射性原子，它有一定概率衰变。"
          },
          {
            "text": "一旦衰变，就触发机关释放毒气，猫死亡。"
          },
          {
            "text": "原子处于衰变与未衰变的叠加，于是猫也处于死与活的叠加。"
          },
          {
            "text": "只有打开盒子观测，叠加态才坍缩为确定的死或活。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "猫的状态是死与活的量子叠加。",
            "formula": "|\\text{猫}\\rangle = \\tfrac{1}{\\sqrt2}(|\\text{活}\\rangle + |\\text{死}\\rangle)"
          },
          {
            "text": "衰变概率随时间增长，叠加权重随之改变。",
            "formula": "P(\\text{死}) = 1 - e^{-\\lambda t}"
          },
          {
            "text": "观测前，活与死并存；观测瞬间，二选一。"
          },
          {
            "text": "这个悖论揭示了量子测量问题的深刻性。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "推进时间，观察衰变概率与叠加权重的变化。"
          },
          {
            "text": "在打开盒子前，猫始终是死活叠加的朦胧态。"
          },
          {
            "text": "点击开盒观测，让叠加态坍缩为确定结果。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "这个实验推动了人们对量子测量问题的深入思考。"
          },
          {
            "text": "退相干理论解释了为何宏观物体看不到叠加。"
          },
          {
            "text": "如今科学家已能在实验室制造小型的猫态。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "薛定谔的猫把微观叠加放大到宏观，形成既死又活的悖论。"
          },
          {
            "text": "观测导致叠加坍缩为确定状态。"
          },
          {
            "text": "它是理解量子测量的经典隐喻。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "哥本哈根诠释",
        "description": "测量使叠加坍缩"
      },
      {
        "title": "退相干理论",
        "description": "为何宏观看不到叠加"
      }
    ]
  },
  {
    "slug": "quantum-rng",
    "title": "量子随机数发生器",
    "subtitle": "用量子叠加产生真随机",
    "category": "量子信息",
    "difficulty": "intermediate",
    "targetAge": "16-17岁",
    "sourcePath": "/quantum-rng",
    "sourceChunk": "QuantumRngExperiment-Dmljlfm2.js",
    "objectives": [
      "区分伪随机与真随机",
      "理解量子测量的本征随机性",
      "认识量子随机数的应用"
    ],
    "prerequisites": [
      "量子叠加",
      "量子测量",
      "概率"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到量子随机数！计算机生成的随机数其实都是假的。"
          },
          {
            "text": "它们由算法算出，只要知道种子就能预测，叫伪随机。"
          },
          {
            "text": "而量子测量能给出真正不可预测的随机数。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "把量子比特用阿达马门置于均等叠加态。"
          },
          {
            "text": "这时测量结果是 0 还是 1，完全是随机的。"
          },
          {
            "text": "这种随机性源于量子力学的本质，没有隐藏的规律。"
          },
          {
            "text": "反复测量并拼接比特，就得到一串真随机数。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "叠加态测得 0 或 1 各占一半。",
            "formula": "P(0) = P(1) = \\tfrac{1}{2}"
          },
          {
            "text": "每个比特携带一比特的随机信息熵。",
            "formula": "H = 1\\,\\text{bit}"
          },
          {
            "text": "好的随机源应当 0 和 1 频率均衡、无可预测模式。"
          },
          {
            "text": "量子随机数从物理层面保证了这种不可预测性。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "点击生成，让量子比特测量产生随机比特。"
          },
          {
            "text": "观察 0 和 1 的频率逐渐趋于均衡。"
          },
          {
            "text": "生成一串比特，拼成一个真随机数。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "量子随机数用于加密密钥，安全性极高。"
          },
          {
            "text": "科学模拟和彩票抽奖也需要高质量随机源。"
          },
          {
            "text": "已有商用量子随机数芯片走向市场。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "量子随机数利用叠加态测量的本征随机性。"
          },
          {
            "text": "它不可预测，0 和 1 各占一半，是真随机。"
          },
          {
            "text": "在密码学中有重要价值。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "伪随机数的缺陷",
        "description": "可预测的算法生成"
      },
      {
        "title": "量子随机性",
        "description": "自然界的真随机源"
      }
    ]
  },
  {
    "slug": "bb84",
    "title": "BB84 量子密钥分发",
    "subtitle": "用量子态安全传递密钥",
    "category": "量子信息",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/bb84",
    "sourceChunk": "BB84Experiment-HA0Ewsla.js",
    "objectives": [
      "理解量子密钥分发原理",
      "认识测量基的作用",
      "了解窃听如何被发现"
    ],
    "prerequisites": [
      "量子比特",
      "偏振",
      "量子测量"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到 BB84 协议——第一个量子密钥分发方案。"
          },
          {
            "text": "它让两个人共享一串只有他们知道的密钥。"
          },
          {
            "text": "更妙的是，任何窃听都会被立刻发现。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "发送方用随机选择的两种基，把比特编码到光子偏振上。"
          },
          {
            "text": "接收方也随机选基去测量每个光子。"
          },
          {
            "text": "事后双方公布所用的基，只保留基相同的那些比特。"
          },
          {
            "text": "这些保留下来的比特，就构成共享密钥。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "基相同时结果一致，基不同时结果随机。"
          },
          {
            "text": "双方基相同的概率约为一半。",
            "formula": "P(\\text{基相同}) = \\tfrac{1}{2}"
          },
          {
            "text": "窃听者测量会扰动量子态，引入错误。"
          },
          {
            "text": "通过比对部分密钥的错误率，就能察觉窃听。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "生成一轮密钥分发，观察双方的基与比特。"
          },
          {
            "text": "看哪些位置基相同、被保留为密钥。"
          },
          {
            "text": "开启窃听者，观察错误率如何暴露窃听。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "BB84 是现实量子保密通信的基础协议。"
          },
          {
            "text": "我国墨子号卫星实现了星地量子密钥分发。"
          },
          {
            "text": "量子密钥的安全性由物理定律而非计算难度保证。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "BB84 用随机基编码和测量光子来分发密钥。"
          },
          {
            "text": "只保留基相同的比特，窃听会引入可察觉的错误。"
          },
          {
            "text": "它的安全性由量子力学保证。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "量子不可克隆定理",
        "description": "窃听必然留下痕迹"
      },
      {
        "title": "墨子号卫星",
        "description": "星地量子密钥分发"
      }
    ]
  },
  {
    "slug": "quantum-teleportation",
    "title": "量子隐形传态",
    "subtitle": "用纠缠传递未知量子态",
    "category": "量子信息",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/quantum-teleportation",
    "sourceChunk": "QuantumTeleportationExperiment-IFunnJn9.js",
    "objectives": [
      "理解隐形传态的步骤",
      "认识纠缠与经典通信的配合",
      "了解不可克隆定理的体现"
    ],
    "prerequisites": [
      "量子纠缠",
      "贝尔态",
      "量子测量"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到量子隐形传态！这不是科幻里的瞬间移动。"
          },
          {
            "text": "它传送的不是物质，而是一个未知量子态的全部信息。"
          },
          {
            "text": "借助纠缠和一点经典通信，量子态就能在远方重现。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "Alice 和 Bob 预先共享一对纠缠粒子。"
          },
          {
            "text": "Alice 把待传的未知态与自己的纠缠粒子做联合测量。"
          },
          {
            "text": "测量得到两个经典比特，她通过普通信道发给 Bob。"
          },
          {
            "text": "Bob 据此对自己的粒子做相应操作，就还原出原始量子态。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "待传态是一个一般的量子比特。",
            "formula": "|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle"
          },
          {
            "text": "Alice 的贝尔测量有四种等概率结果。",
            "formula": "P = \\tfrac{1}{4}\\ \\text{每种}"
          },
          {
            "text": "Bob 根据收到的两比特，作用 I、X、Z 或 XZ 修正。"
          },
          {
            "text": "原态在 Alice 处被测量破坏，所以并没有复制，符合不可克隆定理。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "设置待传量子态，然后启动隐形传态流程。"
          },
          {
            "text": "观察贝尔测量、经典比特传输和 Bob 的修正操作。"
          },
          {
            "text": "确认 Bob 最终得到的态与原态完全一致。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "量子隐形传态是量子网络和量子中继的核心技术。"
          },
          {
            "text": "我国墨子号卫星实现了千公里级的量子隐形传态。"
          },
          {
            "text": "它为未来的量子互联网奠定了基础。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "隐形传态用纠缠加经典通信，把未知量子态送到远方。"
          },
          {
            "text": "Alice 测量破坏原态，Bob 据经典比特修正还原。"
          },
          {
            "text": "它没有复制量子态，是量子网络的基石。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "量子不可克隆定理",
        "description": "原态在传送中被破坏"
      },
      {
        "title": "墨子号实验",
        "description": "千公里级量子隐形传态"
      }
    ]
  },
  {
    "slug": "grover-search",
    "title": "Grover 量子搜索",
    "subtitle": "在无序数据中平方加速查找",
    "category": "量子信息",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/grover-search",
    "sourceChunk": "GroverSearchExperiment-2ufQ7dqz.js",
    "objectives": [
      "理解振幅放大思想",
      "掌握 Grover 的平方加速",
      "认识量子算法的优势"
    ],
    "prerequisites": [
      "量子叠加",
      "量子测量",
      "概率振幅"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到 Grover 算法！在一堆无序数据里找一个目标，经典方法只能逐个试。"
          },
          {
            "text": "N 个里找一个，经典平均要试 N 半数次。"
          },
          {
            "text": "而 Grover 算法只需大约根号 N 次，实现平方级加速。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "先把所有可能答案放进均等叠加态。"
          },
          {
            "text": "Oracle 给目标态打上一个负号，标记出它。"
          },
          {
            "text": "再对平均值做翻转，目标态的振幅就被放大一点。"
          },
          {
            "text": "重复这个过程，目标态概率逐步升高，最后测量几乎必中。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "所需迭代次数约为根号 N。",
            "formula": "k \\approx \\tfrac{\\pi}{4}\\sqrt{N}"
          },
          {
            "text": "每次迭代把态矢量在二维平面转过一个固定角度。"
          },
          {
            "text": "目标态概率随迭代呈正弦式上升。",
            "formula": "P \\approx \\sin^2\\!\\big((2k+1)\\theta\\big)"
          },
          {
            "text": "迭代过多反而会让概率下降，要恰到好处。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "选择数据规模 N 和目标项。"
          },
          {
            "text": "逐步执行 Grover 迭代，观察目标态振幅被放大。"
          },
          {
            "text": "找到使目标概率最高的最佳迭代次数。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "Grover 算法可加速数据库搜索和最优化问题。"
          },
          {
            "text": "它也能加速破解对称密码，影响密码学安全评估。"
          },
          {
            "text": "振幅放大思想是许多量子算法的通用工具。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "Grover 算法用 Oracle 标记加均值翻转放大目标振幅。"
          },
          {
            "text": "约根号 N 次迭代即可高概率找到目标，平方加速。"
          },
          {
            "text": "它展示了量子计算的真实优势。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "振幅放大",
        "description": "逐步增大目标态概率"
      },
      {
        "title": "量子算法优势",
        "description": "O(√N) vs O(N)"
      }
    ]
  },
  {
    "slug": "decoherence",
    "title": "量子退相干",
    "subtitle": "叠加态为何会失去量子性",
    "category": "量子信息",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/decoherence",
    "sourceChunk": "DecoherenceExperiment-D7UI8BX8.js",
    "objectives": [
      "理解相干性与相位",
      "认识环境导致的退相干",
      "了解量子计算的噪声挑战"
    ],
    "prerequisites": [
      "量子叠加",
      "相位",
      "布洛赫球"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎了解量子退相干！它是量子计算最大的敌人之一。"
          },
          {
            "text": "一个完美的叠加态，会因为接触环境而慢慢失去量子性。"
          },
          {
            "text": "退相干，正是宏观世界看不到叠加的原因。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "叠加态的关键在于各分量之间有确定的相位关系，叫相干性。"
          },
          {
            "text": "量子比特无法完全与环境隔绝，会和环境发生纠缠。"
          },
          {
            "text": "这使相位信息泄露到环境中，相干性逐渐丧失。"
          },
          {
            "text": "退相干后，叠加态退化为经典的概率混合，量子优势消失。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "相干性随时间指数衰减。",
            "formula": "\\rho_{01}(t) = \\rho_{01}(0)\\,e^{-t/T_2}"
          },
          {
            "text": "T₂ 是相干时间，越长说明量子比特越稳定。"
          },
          {
            "text": "在布洛赫球上，态矢量逐渐缩向中心轴。"
          },
          {
            "text": "相干时间限制了量子计算能执行多少操作。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调节环境耦合强度，观察相干性衰减的快慢。"
          },
          {
            "text": "推进时间，看态矢量在布洛赫球上向中心收缩。"
          },
          {
            "text": "对比强弱噪声下的相干时间差异。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "延长相干时间是量子计算硬件的核心目标。"
          },
          {
            "text": "超导量子比特用极低温来抑制退相干。"
          },
          {
            "text": "量子纠错码则在算法层面对抗退相干。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "退相干是叠加态因环境作用而失去相位相干性的过程。"
          },
          {
            "text": "相干性按 exp(−t/T₂) 衰减，态矢量缩向中心。"
          },
          {
            "text": "它是量子计算必须克服的难题。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "相干时间",
        "description": "量子比特能保持多久"
      },
      {
        "title": "量子纠错",
        "description": "对抗退相干"
      }
    ]
  },
  {
    "slug": "chsh-bell",
    "title": "CHSH 贝尔不等式",
    "subtitle": "量子关联强于任何经典理论",
    "category": "量子信息",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/chsh-bell",
    "sourceChunk": "CHSHBellExperiment-DFSCe40b.js",
    "objectives": [
      "理解局域隐变量的预言",
      "认识贝尔不等式的破坏",
      "体会量子非定域性"
    ],
    "prerequisites": [
      "量子纠缠",
      "关联",
      "测量基"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到贝尔不等式——量子力学与经典直觉的终极对决。"
          },
          {
            "text": "爱因斯坦相信，世界是局域且实在的，纠缠背后藏着隐变量。"
          },
          {
            "text": "贝尔找到了一个能一锤定音的判据：CHSH 不等式。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "Alice 和 Bob 各自随机选两个测量方向之一。"
          },
          {
            "text": "他们统计四种组合下测量结果的关联强度。"
          },
          {
            "text": "任何局域隐变量理论都要求这个组合量不超过 2。"
          },
          {
            "text": "但量子纠缠却能让它达到约 2.83，超出经典上限。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "CHSH 量由四个关联值组合而成。",
            "formula": "S = E(a,b) - E(a,b') + E(a',b) + E(a',b')"
          },
          {
            "text": "经典局域理论的上限是 2。",
            "formula": "|S|_{\\text{经典}} \\le 2"
          },
          {
            "text": "量子力学能达到的最大值。",
            "formula": "|S|_{\\text{量子}} = 2\\sqrt2 \\approx 2.83"
          },
          {
            "text": "实验测得 S 超过 2，就证明了量子非定域性。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调节 Alice 与 Bob 的测量角度。"
          },
          {
            "text": "观察 CHSH 量 S 随角度的变化。"
          },
          {
            "text": "找到使 S 达到 2.83 的最优角度组合。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "贝尔实验否定了局域隐变量，确立了量子非定域性。"
          },
          {
            "text": "2022 年诺贝尔物理学奖授予了贝尔实验的先驱。"
          },
          {
            "text": "贝尔不等式还用于检验量子设备的安全性。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "CHSH 不等式给出经典关联的上限 2。"
          },
          {
            "text": "量子纠缠能达到 2.83，破坏了不等式。"
          },
          {
            "text": "这证明世界不是局域实在的。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "局域实在论",
        "description": "爱因斯坦的直觉"
      },
      {
        "title": "贝尔实验",
        "description": "2022 诺贝尔物理学奖"
      }
    ]
  },
  {
    "slug": "time-dilation",
    "title": "狭义相对论：时间膨胀",
    "subtitle": "运动的钟走得更慢",
    "category": "相对论",
    "difficulty": "advanced",
    "targetAge": "16-17岁",
    "sourcePath": "/time-dilation",
    "sourceChunk": "TimeDilationExperiment-4Bs1i5tD.js",
    "objectives": [
      "理解时间膨胀效应",
      "掌握洛伦兹因子",
      "认识光速不变原理"
    ],
    "prerequisites": [
      "参考系",
      "光速",
      "相对运动"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到狭义相对论！爱因斯坦告诉我们，时间并非绝对。"
          },
          {
            "text": "一个高速运动的钟，在静止的人看来走得更慢。"
          },
          {
            "text": "速度越接近光速，这种时间变慢就越显著。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "一切惯性系中光速都相同，这是相对论的基石。"
          },
          {
            "text": "想象一个光在两镜间往返的光钟。"
          },
          {
            "text": "钟运动时，光走的是更长的斜线路径。"
          },
          {
            "text": "光速不变，路径更长，所以一个滴答耗时更久，时间变慢。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "运动时间与静止时间相差一个洛伦兹因子。",
            "formula": "\\Delta t = \\gamma\\,\\Delta t_0"
          },
          {
            "text": "洛伦兹因子由速度与光速之比决定。",
            "formula": "\\gamma = \\dfrac{1}{\\sqrt{1-v^2/c^2}}"
          },
          {
            "text": "速度远小于光速时，γ 约等于 1，几乎察觉不到。"
          },
          {
            "text": "速度接近光速时，γ 急剧增大，时间大幅变慢。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调节速度，观察洛伦兹因子如何随之增大。"
          },
          {
            "text": "对比运动光钟与静止光钟的滴答快慢。"
          },
          {
            "text": "把速度推到接近光速，看时间几乎停滞。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "高空μ子因时间膨胀得以到达地面，是直接证据。"
          },
          {
            "text": "GPS 卫星必须修正相对论时间效应才能精确定位。"
          },
          {
            "text": "粒子加速器里的粒子寿命也因高速而延长。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "光速不变导致运动的钟变慢，这就是时间膨胀。"
          },
          {
            "text": "效应大小由洛伦兹因子 γ 描述，速度越快越显著。"
          },
          {
            "text": "μ子与 GPS 都印证了它。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "光钟思想实验",
        "description": "推导时间膨胀"
      },
      {
        "title": "μ子寿命",
        "description": "时间膨胀的实验证据"
      }
    ]
  },
  {
    "slug": "length-contraction",
    "title": "狭义相对论：长度收缩",
    "subtitle": "运动的物体在运动方向上变短",
    "category": "相对论",
    "difficulty": "advanced",
    "targetAge": "16-17岁",
    "sourcePath": "/length-contraction",
    "sourceChunk": "LengthContractionExperiment-Bz-DwuMZ.js",
    "objectives": [
      "理解长度收缩效应",
      "掌握收缩公式",
      "认识与时间膨胀的对称性"
    ],
    "prerequisites": [
      "参考系",
      "光速",
      "时间膨胀"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎继续相对论之旅！时间会变慢，空间也会改变。"
          },
          {
            "text": "一个高速运动的物体，在运动方向上会变短。"
          },
          {
            "text": "这就是长度收缩，与时间膨胀互为表里。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "物体静止时测得的长度叫固有长度，最长。"
          },
          {
            "text": "当物体高速掠过，观察者测得的长度会变短。"
          },
          {
            "text": "收缩只发生在运动方向上，垂直方向不变。"
          },
          {
            "text": "这不是物体真被压扁，而是时空测量的本质效应。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "观测长度等于固有长度除以洛伦兹因子。",
            "formula": "L = \\dfrac{L_0}{\\gamma}"
          },
          {
            "text": "洛伦兹因子总是大于等于 1。",
            "formula": "\\gamma = \\dfrac{1}{\\sqrt{1-v^2/c^2}}"
          },
          {
            "text": "所以观测长度总是小于等于固有长度。"
          },
          {
            "text": "速度趋近光速时，长度趋向于零。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调节速度，观察飞船在运动方向上被压缩。"
          },
          {
            "text": "注意垂直方向的尺寸始终不变。"
          },
          {
            "text": "把速度推到接近光速，看飞船收缩成一条线。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "从μ子自身看，是大气层厚度收缩使它得以穿越。"
          },
          {
            "text": "长度收缩与时间膨胀在不同参考系中相互对应。"
          },
          {
            "text": "它是理解相对论时空观的重要一环。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "运动物体在运动方向上收缩，L=L₀/γ。"
          },
          {
            "text": "只在运动方向收缩，垂直方向不变。"
          },
          {
            "text": "它与时间膨胀共同构成相对论时空观。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "车库佯谬",
        "description": "长度收缩的趣味悖论"
      },
      {
        "title": "相对论的对称性",
        "description": "时间与空间的统一"
      }
    ]
  },
  {
    "slug": "twin-paradox",
    "title": "双生子佯谬",
    "subtitle": "太空旅行归来谁更年轻",
    "category": "相对论",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/twin-paradox",
    "sourceChunk": "TwinParadoxExperiment-CnbZqAPl.js",
    "objectives": [
      "理解佯谬的来龙去脉",
      "认识加速参考系的不对称",
      "掌握时间膨胀的累积效应"
    ],
    "prerequisites": [
      "时间膨胀",
      "惯性系",
      "洛伦兹因子"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到著名的双生子佯谬！一对双胞胎，一个留在地球，一个乘飞船遨游太空。"
          },
          {
            "text": "当旅行者归来，他竟然比留守的兄弟年轻。"
          },
          {
            "text": "这听上去矛盾，却是相对论的真实预言。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "看似矛盾：双方都觉得对方在运动、对方的钟更慢。"
          },
          {
            "text": "但两人的情况其实并不对称。"
          },
          {
            "text": "旅行者必须减速、掉头、再加速返回，经历了加速。"
          },
          {
            "text": "正是这段加速打破了对称，使旅行者真的更年轻。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "旅行者经历的时间是地球时间除以洛伦兹因子。",
            "formula": "t_{\\text{旅}} = \\dfrac{t_{\\text{地}}}{\\gamma}"
          },
          {
            "text": "洛伦兹因子由飞行速度决定。",
            "formula": "\\gamma = \\dfrac{1}{\\sqrt{1-v^2/c^2}}"
          },
          {
            "text": "速度越快、旅程越长，年龄差就越大。"
          },
          {
            "text": "以 0.8 倍光速往返，旅行者只老了地球时间的六成。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "设置飞船速度和地球流逝的年数。"
          },
          {
            "text": "对比归来时两兄弟各自的年龄。"
          },
          {
            "text": "提高速度，看年龄差如何拉大。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "原子钟环球飞行实验已直接验证了这种时间差。"
          },
          {
            "text": "它揭示了固有时取决于世界线的路径。"
          },
          {
            "text": "佯谬的破解加深了我们对时空结构的理解。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "旅行的双胞胎归来更年轻，因为他经历了加速、情况不对称。"
          },
          {
            "text": "旅行者时间是地球时间的 1/γ，速度越快差距越大。"
          },
          {
            "text": "原子钟实验证实了它。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "佯谬的破解",
        "description": "谁经历了加速"
      },
      {
        "title": "相对论时空图",
        "description": "世界线与固有时"
      }
    ]
  },
  {
    "slug": "relativistic-doppler",
    "title": "相对论多普勒效应",
    "subtitle": "高速光源的红移与蓝移",
    "category": "相对论",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/relativistic-doppler",
    "sourceChunk": "RelativisticDopplerExperiment-CVzT0Zsp.js",
    "objectives": [
      "理解相对论多普勒公式",
      "区分经典与相对论多普勒",
      "认识横向多普勒效应"
    ],
    "prerequisites": [
      "多普勒效应",
      "时间膨胀",
      "光速不变"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到相对论多普勒效应！光源高速运动时，颜色会发生改变。"
          },
          {
            "text": "迎面而来变蓝，远离而去变红。"
          },
          {
            "text": "但相对论的版本，还额外包含了时间膨胀的贡献。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "光源远离时，相邻波峰要追赶更远，波长被拉长，发生红移。"
          },
          {
            "text": "光源接近时，波长被压缩，发生蓝移。"
          },
          {
            "text": "与声波不同，光速对所有观察者相同，还要计入时间膨胀。"
          },
          {
            "text": "即使光源横向掠过，也有纯粹由时间膨胀引起的横向红移。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "纵向相对论多普勒公式如下。",
            "formula": "f_{obs} = f_0\\sqrt{\\dfrac{1-\\beta}{1+\\beta}}\\ (\\text{远离})"
          },
          {
            "text": "接近时分子分母互换，频率升高。",
            "formula": "f_{obs} = f_0\\sqrt{\\dfrac{1+\\beta}{1-\\beta}}\\ (\\text{接近})"
          },
          {
            "text": "红移量 z 描述波长的相对变化。",
            "formula": "z = \\dfrac{\\lambda_{obs}-\\lambda_0}{\\lambda_0}"
          },
          {
            "text": "速度越接近光速，红移或蓝移就越剧烈。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调节光源速度和运动方向，观察颜色变化。"
          },
          {
            "text": "比较接近时的蓝移与远离时的红移。"
          },
          {
            "text": "把速度推到接近光速，看红移急剧增大。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "天文学家用红移测量恒星和星系的退行速度。"
          },
          {
            "text": "宇宙学红移揭示了宇宙的膨胀。"
          },
          {
            "text": "横向多普勒实验直接验证了时间膨胀。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "相对论多普勒效应使运动光源红移或蓝移。"
          },
          {
            "text": "它在经典效应之外还包含时间膨胀的贡献。"
          },
          {
            "text": "是测量天体速度的重要工具。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "宇宙学红移",
        "description": "星系退行的观测"
      },
      {
        "title": "横向多普勒",
        "description": "纯时间膨胀效应"
      }
    ]
  },
  {
    "slug": "velocity-addition",
    "title": "相对论速度合成",
    "subtitle": "为何速度永远追不上光",
    "category": "相对论",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/velocity-addition",
    "sourceChunk": "VelocityAdditionExperiment-77A7WL1O.js",
    "objectives": [
      "理解相对论速度叠加",
      "认识光速不可超越",
      "对比伽利略变换"
    ],
    "prerequisites": [
      "参考系",
      "光速不变",
      "相对运动"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到相对论速度合成！在火箭上再打出一颗高速炮弹，速度怎么叠加？"
          },
          {
            "text": "日常经验告诉我们，速度直接相加。"
          },
          {
            "text": "但接近光速时，这条规则失效了，速度永远追不上光。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "伽利略变换中，两个速度简单相加。"
          },
          {
            "text": "但这会让两个 0.8 倍光速叠加超过光速，违背相对论。"
          },
          {
            "text": "相对论的速度合成公式带一个修正分母。"
          },
          {
            "text": "无论怎么叠加，结果都不会超过光速。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "相对论速度合成公式。",
            "formula": "u = \\dfrac{v_1+v_2}{1+v_1 v_2/c^2}"
          },
          {
            "text": "低速时分母约为 1，退化为经典的简单相加。"
          },
          {
            "text": "两个 0.8c 相加，结果约 0.976c，仍小于光速。"
          },
          {
            "text": "若其中一个是光速 c，合成结果仍是 c。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调节两个速度，对比经典相加与相对论合成的结果。"
          },
          {
            "text": "观察相对论结果始终被锁在光速以下。"
          },
          {
            "text": "把任一速度设为光速，验证结果仍是光速。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "高能粒子对撞的相对速度必须用此公式计算。"
          },
          {
            "text": "它保证了光速作为宇宙速度上限的地位。"
          },
          {
            "text": "光速上限维护了因果律不被破坏。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "相对论速度合成带修正分母，结果永不超光速。"
          },
          {
            "text": "低速时退化为经典相加，高速时显著偏离。"
          },
          {
            "text": "光速是不可逾越的上限。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "伽利略速度叠加",
        "description": "低速近似"
      },
      {
        "title": "光速上限",
        "description": "因果律的守护"
      }
    ]
  },
  {
    "slug": "relativistic-momentum",
    "title": "相对论性动量与能量",
    "subtitle": "质量随速度而增的效应",
    "category": "相对论",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/relativistic-momentum",
    "sourceChunk": "RelativisticMomentumExperiment-yVDZajXw.js",
    "objectives": [
      "理解相对论动量公式",
      "认识能量随速度的发散",
      "理解光速不可达"
    ],
    "prerequisites": [
      "动量",
      "动能",
      "洛伦兹因子"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎探索相对论性动量！为什么再大的力也无法把粒子加速到光速？"
          },
          {
            "text": "答案是：随着速度增加，物体变得越来越难推动。"
          },
          {
            "text": "它的动量和能量在接近光速时趋向无穷大。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "经典动量是质量乘速度，可以无限增大。"
          },
          {
            "text": "相对论动量在此基础上乘以洛伦兹因子 γ。"
          },
          {
            "text": "速度接近光速时 γ 趋于无穷，动量随之发散。"
          },
          {
            "text": "要继续加速就需要无穷大的能量，所以光速不可达。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "相对论动量。",
            "formula": "p = \\gamma m v"
          },
          {
            "text": "总能量等于 γ 乘以静能。",
            "formula": "E = \\gamma m c^2"
          },
          {
            "text": "能量动量关系把它们联系起来。",
            "formula": "E^2 = (pc)^2 + (mc^2)^2"
          },
          {
            "text": "动能是总能量减去静能。",
            "formula": "E_k = (\\gamma-1)mc^2"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调节速度，观察动量与能量曲线的发散。"
          },
          {
            "text": "对比经典动量与相对论动量的差异。"
          },
          {
            "text": "把速度推到接近光速，看能量陡然飙升。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "粒子加速器必须用相对论公式设计磁场和能量。"
          },
          {
            "text": "高能物理中的粒子能量远超其静能。"
          },
          {
            "text": "相对论动量是核反应与高能实验的基础。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "相对论动量 p=γmv，能量 E=γmc²，接近光速时发散。"
          },
          {
            "text": "加速到光速需要无穷能量，因此不可达。"
          },
          {
            "text": "它是高能物理的基石。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "能量-动量关系",
        "description": "E²=(pc)²+(mc²)²"
      },
      {
        "title": "加速器的极限",
        "description": "为何无法把粒子加速到光速"
      }
    ]
  },
  {
    "slug": "simultaneity",
    "title": "同时性的相对性",
    "subtitle": "此时此地因人而异",
    "category": "相对论",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/simultaneity",
    "sourceChunk": "SimultaneityExperiment-CrEHmqBJ.js",
    "objectives": [
      "理解同时性的相对性",
      "认识参考系对事件顺序的影响",
      "体会爱因斯坦火车思想实验"
    ],
    "prerequisites": [
      "参考系",
      "光速不变",
      "洛伦兹变换"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到同时性的相对性！两件事是否同时发生，竟然因人而异。"
          },
          {
            "text": "在一个人看来同时的两个事件，在另一个运动的人看来却有先后。"
          },
          {
            "text": "这是爱因斯坦相对论中最反直觉的结论之一。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "设想一列高速行驶的火车，车厢正中有一盏灯。"
          },
          {
            "text": "车上的人看：灯光同时到达车头和车尾。"
          },
          {
            "text": "站台上的人看：车尾迎着光，车头在逃离光。"
          },
          {
            "text": "由于光速不变，站台观察者认为光先到车尾，并不同时。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "不同参考系的时间由洛伦兹变换联系。",
            "formula": "t' = \\gamma\\left(t - \\dfrac{vx}{c^2}\\right)"
          },
          {
            "text": "关键在于含位置 x 的那一项。"
          },
          {
            "text": "两事件空间间隔越大、速度越快，时间差越明显。",
            "formula": "\\Delta t' = -\\gamma\\dfrac{v\\,\\Delta x}{c^2}"
          },
          {
            "text": "只有同地发生的事件，所有人才一致认为同时。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调节火车速度，观察站台参考系中光到达两端的时间差。"
          },
          {
            "text": "对比车上与站台两个视角下的事件顺序。"
          },
          {
            "text": "提高速度，看同时性破缺越发明显。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "同时性的相对性是理解洛伦兹变换的关键。"
          },
          {
            "text": "它解释了双生子佯谬等诸多相对论现象。"
          },
          {
            "text": "它彻底改变了人类对时间和空间的认识。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "同时性是相对的，取决于观察者的参考系。"
          },
          {
            "text": "光速不变导致不同参考系对事件顺序判断不同。"
          },
          {
            "text": "只有同地事件才绝对同时。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "爱因斯坦火车",
        "description": "闪电与列车思想实验"
      },
      {
        "title": "洛伦兹变换",
        "description": "时空坐标的变换"
      }
    ]
  },
  {
    "slug": "mass-energy-equivalence",
    "title": "质能等价 E=mc²",
    "subtitle": "质量与能量的深刻统一",
    "category": "相对论",
    "difficulty": "advanced",
    "targetAge": "16-17岁",
    "sourcePath": "/mass-energy-equivalence",
    "sourceChunk": "MassEnergyEquivalenceExperiment-BBEBf209.js",
    "objectives": [
      "理解质量即能量",
      "掌握质量亏损与释能",
      "认识核能的来源"
    ],
    "prerequisites": [
      "能量守恒",
      "洛伦兹因子",
      "原子核"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到也许是物理学最著名的方程：E 等于 m c 平方。"
          },
          {
            "text": "它告诉我们，质量和能量其实是同一事物的两面。"
          },
          {
            "text": "哪怕一丁点质量，也蕴含着惊人的能量。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "一个静止的物体，本身就拥有能量，叫静能。"
          },
          {
            "text": "因为光速 c 非常大，c 的平方更是天文数字。"
          },
          {
            "text": "所以极小的质量，对应着极大的能量。"
          },
          {
            "text": "核反应中损失的微小质量，转化为巨大的能量释放。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "静止物体的能量等于质量乘光速平方。",
            "formula": "E_0 = mc^2"
          },
          {
            "text": "运动时总能量还要乘上洛伦兹因子。",
            "formula": "E = \\gamma mc^2"
          },
          {
            "text": "核反应释放的能量来自质量亏损。",
            "formula": "\\Delta E = \\Delta m\\,c^2"
          },
          {
            "text": "1 克质量完全转化，相当于约 9×10¹³ 焦耳。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "输入一个质量，计算它蕴含的静能。"
          },
          {
            "text": "把这能量换算成日常单位，体会其惊人之大。"
          },
          {
            "text": "观察质量亏损与释放能量的对应关系。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "核电站靠铀核裂变的质量亏损发电。"
          },
          {
            "text": "太阳通过氢核聚变，每秒损失数百万吨质量发光发热。"
          },
          {
            "text": "正反物质湮灭则把质量百分百转化为能量。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "E=mc² 揭示质量与能量等价，可相互转化。"
          },
          {
            "text": "微小质量对应巨大能量，因为 c² 极大。"
          },
          {
            "text": "它是核能与恒星发光的根本原理。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "核裂变与聚变",
        "description": "质量亏损释放巨大能量"
      },
      {
        "title": "正反物质湮灭",
        "description": "质量完全转化为能量"
      }
    ]
  },
  {
    "slug": "light-cone",
    "title": "光锥与因果结构",
    "subtitle": "时空中的过去、未来与他处",
    "category": "相对论",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/light-cone",
    "sourceChunk": "LightConeExperiment-Dvy7Oyi6.js",
    "objectives": [
      "理解时空间隔的分类",
      "认识光锥与因果律",
      "区分类时、类光、类空"
    ],
    "prerequisites": [
      "时空图",
      "光速不变",
      "同时性"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到光锥——相对论时空的因果地图。"
          },
          {
            "text": "从此时此地出发，光向各方传播，划出一个锥形。"
          },
          {
            "text": "这个光锥决定了哪些事件能够互相影响。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "在时空图上，纵轴是时间，横轴是空间。"
          },
          {
            "text": "光以 45 度斜线传播，构成光锥的边界。"
          },
          {
            "text": "锥内上方是未来、下方是过去，都能与原点有因果联系。"
          },
          {
            "text": "锥外是别处，与原点无法因果相连，因为那需要超光速。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "时空间隔由时间和空间共同决定。",
            "formula": "s^2 = (c\\Delta t)^2 - \\Delta x^2"
          },
          {
            "text": "s²>0 为类时间隔，事件可有因果关系。"
          },
          {
            "text": "s²=0 为类光间隔，恰好由光信号连接。"
          },
          {
            "text": "s²<0 为类空间隔，事件互不影响。这个间隔对所有观察者相同。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "在时空图上放置一个事件点。"
          },
          {
            "text": "观察它落在光锥内、锥上还是锥外。"
          },
          {
            "text": "判断它与原点是否可能有因果关系。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "光锥结构保证了因果律不被破坏。"
          },
          {
            "text": "它解释了为何不能用超光速传递信息。"
          },
          {
            "text": "在广义相对论中，光锥还会被引力弯曲。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "光锥把时空分为可因果相连的锥内与无关的锥外。"
          },
          {
            "text": "时空间隔 s² 分为类时、类光、类空三类。"
          },
          {
            "text": "它是因果律的几何表达。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "时空间隔不变量",
        "description": "所有观察者一致"
      },
      {
        "title": "因果律",
        "description": "为何不能超光速通信"
      }
    ]
  },
  {
    "slug": "gravitational-time-dilation",
    "title": "引力时间膨胀",
    "subtitle": "强引力场中时间变慢",
    "category": "相对论",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/gravitational-time-dilation",
    "sourceChunk": "GravitationalTimeDilationExperiment-M8b525cq.js",
    "objectives": [
      "理解广义相对论的时间膨胀",
      "认识引力势对时间的影响",
      "了解黑洞视界附近的极端效应"
    ],
    "prerequisites": [
      "引力势",
      "史瓦西半径",
      "时间膨胀"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎进入广义相对论！不只是运动，引力也会让时间变慢。"
          },
          {
            "text": "在强引力场中，时钟走得比远处更慢。"
          },
          {
            "text": "越靠近黑洞，时间变慢就越极端。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "广义相对论把引力解释为时空的弯曲。"
          },
          {
            "text": "质量越大、越靠近，时空弯曲越剧烈。"
          },
          {
            "text": "在深引力势阱中，本地时钟相对远方走得更慢。"
          },
          {
            "text": "在黑洞视界处，从远处看时间仿佛完全停滞。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "史瓦西时空中的引力时间膨胀因子。",
            "formula": "\\dfrac{d\\tau}{dt} = \\sqrt{1 - \\dfrac{r_s}{r}}"
          },
          {
            "text": "rs 是史瓦西半径，r 是离中心的距离。"
          },
          {
            "text": "r 远大于 rs 时，因子接近 1，时间几乎不变。"
          },
          {
            "text": "r 趋近 rs 时，因子趋于 0，时间趋于停滞。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调节时钟离黑洞的距离，观察时间流逝速率。"
          },
          {
            "text": "靠近视界，看本地时间相对远方急剧变慢。"
          },
          {
            "text": "对比近处与远处两个时钟的快慢。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "GPS 卫星处于较弱引力场，钟走得更快，须修正。"
          },
          {
            "text": "电影星际穿越中的时间差正源于引力时间膨胀。"
          },
          {
            "text": "它已被精密原子钟在不同高度直接测量验证。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "引力时间膨胀使强引力场中的时钟走得更慢。"
          },
          {
            "text": "因子 √(1-rs/r)，靠近黑洞视界时间趋于停滞。"
          },
          {
            "text": "GPS 与原子钟实验都证实了它。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "星际穿越",
        "description": "黑洞附近的时间"
      },
      {
        "title": "GPS 引力修正",
        "description": "卫星钟更快"
      }
    ]
  },
  {
    "slug": "action-potential",
    "title": "神经元动作电位",
    "subtitle": "离子通道驱动的电脉冲",
    "category": "生物物理",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/action-potential",
    "sourceChunk": "ActionPotentialExperiment-Bf2L1TEX.js",
    "objectives": [
      "理解膜电位与离子通道",
      "认识动作电位的去极化与复极化",
      "了解阈值与全或无律"
    ],
    "prerequisites": [
      "电位",
      "离子",
      "细胞膜"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到生物物理！你的每一个念头，都是神经元上的电脉冲。"
          },
          {
            "text": "这种脉冲叫动作电位，能沿神经飞快传播。"
          },
          {
            "text": "它的背后，是离子在细胞膜上的精巧舞蹈。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "静息时，细胞膜内外有约负70毫伏的电位差。"
          },
          {
            "text": "刺激超过阈值，钠离子通道打开，钠流入，电位飙升，称去极化。"
          },
          {
            "text": "随后钾离子通道打开，钾流出，电位回落，称复极化。"
          },
          {
            "text": "短暂过冲后回到静息，整个过程只需几毫秒。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "膜电位由各离子电导与平衡电位决定。",
            "formula": "C\\dfrac{dV}{dt} = -\\sum_i g_i (V - E_i)"
          },
          {
            "text": "钠和钾通道的电导随电压和时间变化。"
          },
          {
            "text": "只有刺激越过阈值，才能触发完整的动作电位。"
          },
          {
            "text": "动作电位遵循全或无律：要么完整爆发，要么不发生。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "施加不同强度的刺激，观察是否触发动作电位。"
          },
          {
            "text": "低于阈值时只有小波动，超过阈值则完整爆发。"
          },
          {
            "text": "注意去极化、复极化与不应期的完整波形。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "Hodgkin 和 Huxley 因这一模型获得诺贝尔奖。"
          },
          {
            "text": "它是理解大脑、心脏电活动的基础。"
          },
          {
            "text": "心电图和脑电图记录的正是这些电信号。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "动作电位由钠钾离子通道的开闭驱动。"
          },
          {
            "text": "去极化飙升、复极化回落，遵循全或无律。"
          },
          {
            "text": "它是神经信息传递的物理基础。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "Hodgkin-Huxley 模型",
        "description": "诺奖级的神经电生理模型"
      },
      {
        "title": "全或无律",
        "description": "动作电位的触发机制"
      }
    ]
  },
  {
    "slug": "dna-melting",
    "title": "DNA 熔解",
    "subtitle": "温度如何拆开双螺旋",
    "category": "生物物理",
    "difficulty": "intermediate",
    "targetAge": "16-17岁",
    "sourcePath": "/dna-melting",
    "sourceChunk": "DnaMeltingExperiment-BBddsRri.js",
    "objectives": [
      "理解碱基对的氢键",
      "掌握熔解温度概念",
      "认识 GC 含量的影响"
    ],
    "prerequisites": [
      "氢键",
      "热运动",
      "双螺旋"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎了解 DNA 熔解！双螺旋的两条链，能被加热拆开。"
          },
          {
            "text": "就像拉开一条分子拉链，温度越高拆得越多。"
          },
          {
            "text": "这个过程是现代生物技术的关键一步。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "DNA 两条链靠碱基对之间的氢键结合。"
          },
          {
            "text": "A 与 T 之间有 2 个氢键，G 与 C 之间有 3 个。"
          },
          {
            "text": "加热提供能量，热运动逐渐破坏这些氢键。"
          },
          {
            "text": "当一半碱基对断开时，对应的温度叫熔解温度 Tm。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "GC 含量越高，熔解温度越高，因为氢键更多。",
            "formula": "T_m \\propto \\%GC"
          },
          {
            "text": "一个简化估算公式如下。",
            "formula": "T_m \\approx 64.9 + 41\\cdot\\dfrac{\\%GC-16.4}{100}\\,(^\\circ C)"
          },
          {
            "text": "解链比例随温度呈 S 形曲线上升。"
          },
          {
            "text": "GC 多的 DNA 更稳定，需要更高温度才能熔解。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调节温度，观察双螺旋从两端逐渐解开。"
          },
          {
            "text": "改变 GC 含量，看熔解温度如何移动。"
          },
          {
            "text": "找到一半碱基对断开时的熔解温度 Tm。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "PCR 技术靠加热变性把 DNA 解链，再扩增。"
          },
          {
            "text": "引物设计必须精确计算熔解温度。"
          },
          {
            "text": "DNA 熔解分析还用于基因突变检测。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "DNA 双链靠碱基对氢键结合，加热可拆开。"
          },
          {
            "text": "熔解温度 Tm 随 GC 含量升高，GC 键多更稳定。"
          },
          {
            "text": "它是 PCR 等技术的物理基础。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "PCR 技术",
        "description": "靠热变性扩增 DNA"
      },
      {
        "title": "GC 含量",
        "description": "决定 DNA 稳定性"
      }
    ]
  },
  {
    "slug": "dla-growth",
    "title": "扩散限制聚集",
    "subtitle": "随机行走生长出的分形",
    "category": "生物物理",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/dla-growth",
    "sourceChunk": "DlaGrowthExperiment-DV7Ivv7q.js",
    "objectives": [
      "理解扩散限制聚集过程",
      "认识分形生长",
      "了解自然界中的 DLA 形态"
    ],
    "prerequisites": [
      "随机游走",
      "扩散",
      "分形"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到扩散限制聚集！一种由随机性生长出的美丽分形。"
          },
          {
            "text": "粒子随机游走，碰到团簇就粘住，慢慢长成枝杈结构。"
          },
          {
            "text": "雪花、矿脉、闪电痕迹，背后都有它的影子。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "中心先放一颗种子粒子。"
          },
          {
            "text": "新粒子从远处出发，做无规则的随机游走。"
          },
          {
            "text": "一旦碰到已有团簇，就永久粘附在那里。"
          },
          {
            "text": "突出的枝梢更容易被先到的粒子碰到，于是越长越分叉。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "团簇的质量与半径呈分形幂律关系。",
            "formula": "N \\sim R^{D}"
          },
          {
            "text": "二维 DLA 的分形维数约为 1.71，介于线与面之间。",
            "formula": "D \\approx 1.71"
          },
          {
            "text": "非整数维度正是分形的标志。"
          },
          {
            "text": "简单的随机规则，涌现出复杂的自相似结构。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "启动生长，观察粒子一颗颗粘附形成枝杈。"
          },
          {
            "text": "注意团簇总是向外伸展，内部很少填实。"
          },
          {
            "text": "让团簇长大，欣赏自相似的分形形态。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "DLA 解释了电沉积、矿物结晶的枝状形态。"
          },
          {
            "text": "闪电和绝缘击穿的痕迹也是类似的分形。"
          },
          {
            "text": "它是研究自然界图案形成的重要模型。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "扩散限制聚集由随机游走粒子粘附生长而成。"
          },
          {
            "text": "它形成分形维数约 1.71 的枝杈结构。"
          },
          {
            "text": "简单规则涌现复杂图案。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "分形维数",
        "description": "DLA 团簇的非整数维度"
      },
      {
        "title": "自然中的 DLA",
        "description": "雪花、矿脉、电击痕"
      }
    ]
  },
  {
    "slug": "enzyme-kinetics",
    "title": "酶动力学：米氏方程",
    "subtitle": "底物浓度如何决定反应速率",
    "category": "生物物理",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/enzyme-kinetics",
    "sourceChunk": "EnzymeKineticsExperiment-C9RcChFa.js",
    "objectives": [
      "理解米氏方程",
      "认识 Vmax 与 Km 的意义",
      "理解酶的饱和现象"
    ],
    "prerequisites": [
      "化学反应速率",
      "浓度",
      "催化剂"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到酶动力学！酶是生命体内的高效催化剂。"
          },
          {
            "text": "底物越多，反应越快——但快到一定程度就再也上不去了。"
          },
          {
            "text": "这种饱和规律，由著名的米氏方程描述。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "酶先与底物结合形成复合物，再催化生成产物。"
          },
          {
            "text": "底物浓度低时，反应速率几乎与浓度成正比。"
          },
          {
            "text": "底物浓度高时，酶被占满，速率趋于最大值 Vmax。"
          },
          {
            "text": "速率达到一半 Vmax 时的底物浓度，就是米氏常数 Km。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "米氏方程描述反应速率与底物浓度的关系。",
            "formula": "v = \\dfrac{V_{max}[S]}{K_m + [S]}"
          },
          {
            "text": "Vmax 是酶完全饱和时的最大速率。"
          },
          {
            "text": "Km 反映酶对底物的亲和力，Km 越小亲和力越强。"
          },
          {
            "text": "当底物浓度等于 Km 时，速率恰为 Vmax 的一半。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调节底物浓度，观察反应速率沿米氏曲线变化。"
          },
          {
            "text": "改变 Km，看曲线弯曲程度和半饱和点移动。"
          },
          {
            "text": "把底物浓度调到很高，看速率逼近 Vmax 而饱和。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "米氏方程是生物化学和药理学的基础工具。"
          },
          {
            "text": "很多药物正是通过抑制特定酶来发挥作用。"
          },
          {
            "text": "酶动力学分析帮助优化工业发酵和制药过程。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "米氏方程 v=Vmax[S]/(Km+[S]) 描述酶促反应速率。"
          },
          {
            "text": "Vmax 是饱和速率，Km 是半饱和时的底物浓度。"
          },
          {
            "text": "它揭示了酶的饱和催化规律。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "米氏常数 Km",
        "description": "酶对底物的亲和力"
      },
      {
        "title": "酶抑制剂",
        "description": "竞争性与非竞争性抑制"
      }
    ]
  },
  {
    "slug": "ecg",
    "title": "心电图原理",
    "subtitle": "心脏电活动的波形解读",
    "category": "生物物理",
    "difficulty": "intermediate",
    "targetAge": "16-17岁",
    "sourcePath": "/ecg",
    "sourceChunk": "EcgExperiment-Bwlaroxm.js",
    "objectives": [
      "理解心脏的电活动",
      "认识 P-QRS-T 波",
      "了解心率与节律"
    ],
    "prerequisites": [
      "动作电位",
      "电位",
      "生物电"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到心电图！它把心脏的每一次跳动画成一串波形。"
          },
          {
            "text": "医生通过这些起伏，就能读出心脏的健康状况。"
          },
          {
            "text": "这些波形，正是心肌电活动在体表的投影。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "心脏的窦房结像天然起搏器，定时发出电信号。"
          },
          {
            "text": "P 波代表心房去极化，也就是心房收缩。"
          },
          {
            "text": "QRS 波群是心室去极化，幅度最大，对应心室收缩。"
          },
          {
            "text": "T 波是心室复极化，心肌恢复准备下一次跳动。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "心率由相邻 R 波的间隔计算。",
            "formula": "\\text{心率} = \\dfrac{60}{RR\\,\\text{间期}}\\,(\\text{次/分})"
          },
          {
            "text": "正常成人静息心率约为每分钟 60 到 100 次。"
          },
          {
            "text": "RR 间期越短，心率越快。"
          },
          {
            "text": "波形的形状和间期异常，提示可能的心脏问题。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调节心率，观察波形疏密和滚动速度的变化。"
          },
          {
            "text": "辨认每个周期里的 P 波、QRS 波群和 T 波。"
          },
          {
            "text": "注意心率与 RR 间期的反比关系。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "心电图是诊断心律失常和心肌梗死的重要工具。"
          },
          {
            "text": "可穿戴设备如智能手表已能记录简易心电图。"
          },
          {
            "text": "它把抽象的生物电变成可读的临床信息。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "心电图记录心脏电活动，呈现 P、QRS、T 波。"
          },
          {
            "text": "心率由 RR 间期计算，正常为每分钟 60 到 100 次。"
          },
          {
            "text": "它是心脏健康的窗口。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "窦房结",
        "description": "心脏的天然起搏器"
      },
      {
        "title": "心律失常",
        "description": "异常 ECG 波形"
      }
    ]
  },
  {
    "slug": "lotka-volterra",
    "title": "捕食者与猎物",
    "subtitle": "种群数量的周期振荡",
    "category": "生物物理",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/lotka-volterra",
    "sourceChunk": "LotkaVolterraExperiment-DZRQX9G4.js",
    "objectives": [
      "理解种群相互作用",
      "认识洛特卡-沃尔泰拉方程",
      "理解相位差振荡"
    ],
    "prerequisites": [
      "微分方程",
      "指数增长",
      "反馈"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到生态动力学！狐狸和兔子的数量，会怎样此消彼长？"
          },
          {
            "text": "兔子多了，狐狸就有食物而繁盛；狐狸多了，兔子又被吃光。"
          },
          {
            "text": "这种循环，由洛特卡-沃尔泰拉方程精确描述。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "猎物（兔子）在没有天敌时指数增长。"
          },
          {
            "text": "捕食者（狐狸）靠捕食猎物维生，否则会饿死。"
          },
          {
            "text": "两者数量都随时间周期性振荡。"
          },
          {
            "text": "捕食者的高峰总是滞后于猎物的高峰。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "猎物数量变化由增长与被捕食决定。",
            "formula": "\\dfrac{dx}{dt} = \\alpha x - \\beta xy"
          },
          {
            "text": "捕食者数量变化由捕食获益与死亡决定。",
            "formula": "\\dfrac{dy}{dt} = \\delta xy - \\gamma y"
          },
          {
            "text": "两个种群在相空间里画出闭合的环。"
          },
          {
            "text": "振荡的周期和幅度由四个参数共同决定。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调节繁殖率与捕食率，观察振荡周期的变化。"
          },
          {
            "text": "注意捕食者数量的高峰滞后于猎物。"
          },
          {
            "text": "在相空间里观察两种群描出的闭合轨道。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "加拿大猞猁与雪兔的历史数据印证了这种振荡。"
          },
          {
            "text": "该模型用于渔业管理和害虫生物防治。"
          },
          {
            "text": "它也启发了经济学和流行病学中的类似模型。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "洛特卡-沃尔泰拉方程描述捕食者与猎物的相互作用。"
          },
          {
            "text": "两种群周期振荡，捕食者高峰滞后于猎物。"
          },
          {
            "text": "它是种群生态学的经典模型。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "相空间轨道",
        "description": "种群的闭合环"
      },
      {
        "title": "生态平衡",
        "description": "捕食者猎物共存"
      }
    ]
  },
  {
    "slug": "eye-optics",
    "title": "眼睛与视觉光学",
    "subtitle": "近视远视的成像与矫正",
    "category": "生物物理",
    "difficulty": "intermediate",
    "targetAge": "16-17岁",
    "sourcePath": "/eye-optics",
    "sourceChunk": "EyeOpticsExperiment-CQZzT6z-.js",
    "objectives": [
      "理解眼睛的成像原理",
      "认识近视与远视",
      "了解透镜矫正方法"
    ],
    "prerequisites": [
      "透镜成像",
      "焦距",
      "屈光"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到视觉光学！眼睛其实就是一台精巧的相机。"
          },
          {
            "text": "它把外界的光聚焦到视网膜上，形成清晰的像。"
          },
          {
            "text": "当聚焦出了偏差，就成了近视或远视。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "角膜和晶状体一起把光线汇聚到视网膜。"
          },
          {
            "text": "正常眼，像恰好落在视网膜上，看得清楚。"
          },
          {
            "text": "近视眼球太长，像落在视网膜前方，看远模糊。"
          },
          {
            "text": "远视眼球太短，像落在视网膜后方，看近模糊。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "成像遵循薄透镜公式。",
            "formula": "\\dfrac{1}{v} - \\dfrac{1}{u} = \\dfrac{1}{f}"
          },
          {
            "text": "近视用凹透镜（负度数）把像往后推到视网膜。"
          },
          {
            "text": "远视用凸透镜（正度数）把像往前拉到视网膜。"
          },
          {
            "text": "眼镜度数等于焦距倒数乘一百。",
            "formula": "D = \\dfrac{100}{f(\\text{cm})}"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "切换正常、近视、远视，观察像落在视网膜的位置。"
          },
          {
            "text": "加上矫正透镜，看像被重新聚焦到视网膜上。"
          },
          {
            "text": "调节矫正度数，找到使成像清晰的度数。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "配眼镜就是根据屈光不正选择合适度数的透镜。"
          },
          {
            "text": "激光手术通过重塑角膜改变屈光，矫正视力。"
          },
          {
            "text": "理解视觉光学有助于科学用眼、预防近视。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "眼睛把光聚焦到视网膜成像，遵循透镜公式。"
          },
          {
            "text": "近视用凹透镜、远视用凸透镜矫正。"
          },
          {
            "text": "它把光学原理用到了我们的视力健康。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "调节与老花",
        "description": "晶状体的变焦"
      },
      {
        "title": "屈光度",
        "description": "眼镜度数的含义"
      }
    ]
  },
  {
    "slug": "blood-flow",
    "title": "血流动力学",
    "subtitle": "血管半径如何决定血流",
    "category": "生物物理",
    "difficulty": "intermediate",
    "targetAge": "16-17岁",
    "sourcePath": "/blood-flow",
    "sourceChunk": "BloodFlowExperiment-DW12U90L.js",
    "objectives": [
      "理解泊肃叶定律在血管中的应用",
      "认识血管半径的四次方效应",
      "了解血压与血流的关系"
    ],
    "prerequisites": [
      "泊肃叶定律",
      "黏性",
      "压强"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到血流动力学！心脏每天把血液泵遍全身的血管网络。"
          },
          {
            "text": "血管半径的微小变化，竟能戏剧性地改变血流量。"
          },
          {
            "text": "这背后是流体力学中的泊肃叶定律。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "血液是黏性流体，在血管中流动会受到阻力。"
          },
          {
            "text": "流量取决于血压差、血管半径、长度和血液黏度。"
          },
          {
            "text": "其中半径的影响最为惊人，是四次方关系。"
          },
          {
            "text": "半径减半，血流量会骤降到原来的十六分之一。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "泊肃叶定律描述管道流量。",
            "formula": "Q = \\dfrac{\\pi r^4 \\Delta P}{8\\eta L}"
          },
          {
            "text": "流量与半径的四次方成正比。",
            "formula": "Q \\propto r^4"
          },
          {
            "text": "所以血管轻微收缩，就能大幅调节血流和血压。"
          },
          {
            "text": "流量也与血压差成正比，与黏度和长度成反比。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调节血管半径，观察血流量的剧烈变化。"
          },
          {
            "text": "半径减半时，留意流量降到约十六分之一。"
          },
          {
            "text": "改变血压差，看流量如何线性响应。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "人体靠血管收缩舒张来精细调节各处血流。"
          },
          {
            "text": "动脉硬化使血管变窄，血流锐减、血压升高。"
          },
          {
            "text": "这解释了为何血管疾病对健康危害巨大。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "血流遵循泊肃叶定律，流量正比于半径的四次方。"
          },
          {
            "text": "半径减半流量降为十六分之一，调节作用极强。"
          },
          {
            "text": "它是理解血压与血管疾病的物理基础。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "血管收缩与血压",
        "description": "半径微小变化的放大效应"
      },
      {
        "title": "动脉粥样硬化",
        "description": "血管狭窄的危害"
      }
    ]
  },
  {
    "slug": "protein-folding",
    "title": "蛋白质折叠能量景观",
    "subtitle": "漏斗形势能面引导折叠",
    "category": "生物物理",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/protein-folding",
    "sourceChunk": "ProteinFoldingExperiment-BTIyeDQN.js",
    "objectives": [
      "理解能量景观概念",
      "认识折叠漏斗",
      "了解能量最低构象"
    ],
    "prerequisites": [
      "势能",
      "自由能",
      "构象"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到蛋白质折叠！一条氨基酸长链，如何折成精确的三维结构？"
          },
          {
            "text": "如果靠随机尝试，时间比宇宙年龄还长，这叫 Levinthal 佯谬。"
          },
          {
            "text": "答案藏在一个漏斗形的能量景观里。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "每一种折叠构象都对应一个自由能值。"
          },
          {
            "text": "把所有构象的能量画出来，就是能量景观。"
          },
          {
            "text": "这个景观像一个漏斗，天然结构位于漏斗最底部。"
          },
          {
            "text": "蛋白质沿着能量下降的方向，被引导滑向最低点。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "系统总是趋向自由能最低的状态。",
            "formula": "G = H - TS"
          },
          {
            "text": "漏斗形景观保证折叠快速而可靠。"
          },
          {
            "text": "局部的小坑是折叠中间体，可能暂时困住蛋白质。"
          },
          {
            "text": "最终蛋白质落入全局最低，达到天然构象。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "观察蛋白质在能量景观上滚向最低点的过程。"
          },
          {
            "text": "调节温度，看热扰动如何帮助跳出局部陷阱。"
          },
          {
            "text": "注意天然结构总位于漏斗的全局最低处。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "蛋白质错误折叠与阿尔茨海默等疾病密切相关。"
          },
          {
            "text": "AlphaFold 等 AI 已能高精度预测折叠结构。"
          },
          {
            "text": "理解折叠对药物设计和合成生物学至关重要。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "蛋白质折叠由漏斗形能量景观引导，避开随机搜索。"
          },
          {
            "text": "系统趋向自由能最低，天然结构在漏斗底部。"
          },
          {
            "text": "它是分子生物物理的核心问题。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "Levinthal 佯谬",
        "description": "为何折叠不靠随机搜索"
      },
      {
        "title": "蛋白质错误折叠",
        "description": "疾病的分子根源"
      }
    ]
  },
  {
    "slug": "firefly-sync",
    "title": "萤火虫同步",
    "subtitle": "耦合振子的集体同步",
    "category": "生物物理",
    "difficulty": "advanced",
    "targetAge": "17-18岁",
    "sourcePath": "/firefly-sync",
    "sourceChunk": "FireflySyncExperiment-TuKfOosp.js",
    "objectives": [
      "理解耦合振子同步",
      "认识 Kuramoto 模型",
      "了解同步的临界耦合"
    ],
    "prerequisites": [
      "相位",
      "振荡",
      "耦合"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到同步的奇迹！东南亚的萤火虫能成千上万一起闪烁。"
          },
          {
            "text": "没有指挥，它们却渐渐步调一致。"
          },
          {
            "text": "这种自发同步，由 Kuramoto 模型精妙刻画。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "每只萤火虫都是一个有自己节奏的振子。"
          },
          {
            "text": "它们通过看到彼此的闪光而相互影响。"
          },
          {
            "text": "每只都会微调自己的相位，向邻居靠拢。"
          },
          {
            "text": "当耦合足够强，整个群体就涌现出统一的节奏。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "Kuramoto 模型描述每个振子的相位演化。",
            "formula": "\\dot{\\theta_i} = \\omega_i + \\dfrac{K}{N}\\sum_j \\sin(\\theta_j - \\theta_i)"
          },
          {
            "text": "K 是耦合强度，越大越容易同步。"
          },
          {
            "text": "序参量 r 衡量同步程度，0 为完全无序，1 为完全同步。",
            "formula": "r = \\Big|\\tfrac{1}{N}\\sum_j e^{i\\theta_j}\\Big|"
          },
          {
            "text": "超过临界耦合 Kc，系统从无序突然转入同步。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调节耦合强度，观察萤火虫从杂乱到同步。"
          },
          {
            "text": "注意序参量 r 随耦合增大而上升。"
          },
          {
            "text": "在临界耦合附近，看同步如何突然涌现。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "心肌细胞同步收缩，才能让心脏有力跳动。"
          },
          {
            "text": "电网中的发电机必须保持频率同步。"
          },
          {
            "text": "从神经振荡到观众鼓掌，同步无处不在。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "Kuramoto 模型解释了耦合振子的自发同步。"
          },
          {
            "text": "耦合超过临界值时，群体从无序突然转入同步。"
          },
          {
            "text": "它是理解集体行为的经典模型。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "Kuramoto 模型",
        "description": "同步现象的数学描述"
      },
      {
        "title": "自然中的同步",
        "description": "心肌细胞、电网、掌声"
      }
    ]
  },
  {
    "slug": "seismic-waves",
    "title": "地震波：P波与S波",
    "subtitle": "纵波横波如何揭示地球内部",
    "category": "地球物理",
    "difficulty": "intermediate",
    "targetAge": "16-17岁",
    "sourcePath": "/seismic-waves",
    "sourceChunk": "SeismicWavesExperiment-DIqgFklf.js",
    "objectives": [
      "区分纵波P与横波S",
      "理解波速与到时差",
      "认识地震定位原理"
    ],
    "prerequisites": [
      "纵波横波",
      "波速",
      "介质"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到地球物理！地震发生时，会向四面八方发出地震波。"
          },
          {
            "text": "这些波分两种：跑得快的 P 波和跑得慢的 S 波。"
          },
          {
            "text": "正是它们，让科学家看清了地球深处的结构。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "P 波是纵波，介质沿传播方向压缩与拉伸，速度最快。"
          },
          {
            "text": "S 波是横波，介质垂直于传播方向振动，速度较慢。"
          },
          {
            "text": "P 波先到，S 波后到，两者有明显的到时差。"
          },
          {
            "text": "S 波无法穿过液体，由此发现地球有液态的外核。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "P 波速度约为 S 波的 1.7 倍。",
            "formula": "v_P \\approx 1.7\\,v_S"
          },
          {
            "text": "震源距离可由 P、S 到时差估算。",
            "formula": "d = \\dfrac{v_P v_S}{v_P - v_S}\\,\\Delta t"
          },
          {
            "text": "到时差越大，说明震源离得越远。"
          },
          {
            "text": "三个台站的距离圆相交，就能定出震中。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "触发地震，观察 P 波和 S 波先后向外扩散。"
          },
          {
            "text": "注意 P 波总是跑在 S 波前面。"
          },
          {
            "text": "查看台站记录的到时差，估算震源距离。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "地震预警系统利用快速的 P 波抢先发出警报。"
          },
          {
            "text": "地震波层析成像揭示了地幔和地核的结构。"
          },
          {
            "text": "石油勘探也用人工地震波探测地下油气。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "地震波分为快的纵波 P 和慢的横波 S。"
          },
          {
            "text": "P-S 到时差可测震源距离，S 波缺失揭示液态外核。"
          },
          {
            "text": "地震波是探测地球内部的探针。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "地核的发现",
        "description": "S波无法穿过液态外核"
      },
      {
        "title": "震中定位",
        "description": "P-S 到时差测距"
      }
    ]
  },
  {
    "slug": "plate-tectonics",
    "title": "板块构造与地幔对流",
    "subtitle": "驱动大陆漂移的热引擎",
    "category": "地球物理",
    "difficulty": "intermediate",
    "targetAge": "16-17岁",
    "sourcePath": "/plate-tectonics",
    "sourceChunk": "PlateTectonicsExperiment-BRYYA_oe.js",
    "objectives": [
      "理解地幔对流",
      "认识板块边界类型",
      "理解大陆漂移的动力"
    ],
    "prerequisites": [
      "对流",
      "密度",
      "热传递"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎了解板块构造！大陆并非一成不变，而是在缓慢漂移。"
          },
          {
            "text": "地球表面由若干巨大的板块拼成，彼此推挤、分离。"
          },
          {
            "text": "驱动这一切的，是地球内部的热对流。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "地核的热量加热地幔，热物质上升、冷物质下沉。"
          },
          {
            "text": "这形成巨大的对流环，像一锅缓慢翻滚的粥。"
          },
          {
            "text": "对流拖动着上方的板块缓慢移动。"
          },
          {
            "text": "板块在洋中脊分离生长，在俯冲带相撞消亡。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "对流由瑞利数决定，超过临界值才启动。",
            "formula": "Ra = \\dfrac{g\\alpha\\Delta T\\,L^3}{\\nu\\kappa}"
          },
          {
            "text": "温差越大、黏度越低，对流越强烈。"
          },
          {
            "text": "板块移动速度约每年几厘米，和指甲生长差不多。"
          },
          {
            "text": "亿万年累积，足以让大陆漂移数千公里。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调节地幔温差，观察对流环的强弱变化。"
          },
          {
            "text": "看热柱上升、冷柱下沉如何拖动板块。"
          },
          {
            "text": "注意板块在边界处的分离与碰撞。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "板块边界正是地震和火山最频繁的地带。"
          },
          {
            "text": "喜马拉雅山由印度板块撞击欧亚板块隆起而成。"
          },
          {
            "text": "板块理论统一解释了地震、火山和造山运动。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "地幔热对流驱动板块缓慢漂移。"
          },
          {
            "text": "板块在洋中脊生长、在俯冲带消亡。"
          },
          {
            "text": "它是理解地震与造山的统一理论。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "海底扩张",
        "description": "洋中脊的新生地壳"
      },
      {
        "title": "俯冲带",
        "description": "板块消亡与火山"
      }
    ]
  },
  {
    "slug": "geomagnetism",
    "title": "地磁场与磁偏角",
    "subtitle": "指南针为何不完全指北",
    "category": "地球物理",
    "difficulty": "intermediate",
    "targetAge": "16-17岁",
    "sourcePath": "/geomagnetism",
    "sourceChunk": "GeomagnetismExperiment-CqSwcCcD.js",
    "objectives": [
      "理解地磁偶极场",
      "区分磁极与地理极",
      "认识磁偏角与磁倾角"
    ],
    "prerequisites": [
      "磁场",
      "磁偶极",
      "指南针"
    ],
    "sections": [
      {
        "id": "intro",
        "title": "开场引入",
        "lines": [
          {
            "text": "欢迎来到地磁场！指南针之所以能指南北，全靠地球这块大磁铁。"
          },
          {
            "text": "但你知道吗，指南针指的并不是真正的地理北极。"
          },
          {
            "text": "磁极与地理极之间的偏差，叫磁偏角。"
          }
        ]
      },
      {
        "id": "concept",
        "title": "基本概念",
        "lines": [
          {
            "text": "地磁场近似一个大磁偶极子，类似一根插在地心的磁棒。"
          },
          {
            "text": "磁场源于液态外核中导电流体的运动，即发电机效应。"
          },
          {
            "text": "磁极与地理极不重合，且会缓慢移动。"
          },
          {
            "text": "指南针与正北的夹角叫磁偏角，指针下倾的角度叫磁倾角。"
          }
        ]
      },
      {
        "id": "formula",
        "title": "公式解读",
        "lines": [
          {
            "text": "偶极场强度随纬度变化。",
            "formula": "B = \\dfrac{\\mu_0 m}{4\\pi r^3}\\sqrt{1+3\\sin^2\\lambda}"
          },
          {
            "text": "磁倾角与磁纬度满足简单关系。",
            "formula": "\\tan I = 2\\tan\\lambda_m"
          },
          {
            "text": "赤道处磁倾角为零，磁极处接近 90 度。"
          },
          {
            "text": "磁偏角因地而异，导航时必须加以修正。"
          }
        ]
      },
      {
        "id": "interaction",
        "title": "参数互动",
        "lines": [
          {
            "text": "调节所在纬度，观察磁倾角的变化。"
          },
          {
            "text": "看磁场线如何从南半球出、北半球入。"
          },
          {
            "text": "体会赤道磁针水平、极地磁针竖直的差异。"
          }
        ]
      },
      {
        "id": "application",
        "title": "实际应用",
        "lines": [
          {
            "text": "航海和航空导航必须修正磁偏角才能精确定向。"
          },
          {
            "text": "地磁场像盾牌，保护地球免受太阳风的侵袭。"
          },
          {
            "text": "古地磁记录揭示了地磁场曾多次倒转。"
          }
        ]
      },
      {
        "id": "summary",
        "title": "总结回顾",
        "lines": [
          {
            "text": "地磁场近似偶极场，源于外核的发电机效应。"
          },
          {
            "text": "磁极不等于地理极，磁偏角和磁倾角随地而变。"
          },
          {
            "text": "它既助导航，又是地球的保护盾。希望你有所收获！"
          }
        ]
      }
    ],
    "furtherReading": [
      {
        "title": "地磁倒转",
        "description": "磁极的周期性翻转"
      },
      {
        "title": "发电机理论",
        "description": "液态外核产生磁场"
      }
    ]
  }
] as const satisfies readonly PhysicsExperiment[]

export const physicsExperimentBySlug: ReadonlyMap<string, PhysicsExperiment> = new Map(
  physicsExperiments.map((experiment): [string, PhysicsExperiment] => [experiment.slug, experiment]),
)

export const physicsDifficultyLabels: Record<PhysicsDifficulty, string> = {
  beginner: '入门',
  elementary: '基础',
  intermediate: '中级',
  advanced: '高级',
}
