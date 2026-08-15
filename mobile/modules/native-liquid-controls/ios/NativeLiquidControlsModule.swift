import ExpoModulesCore
import UIKit

/// Shared lighter-blue tint for selected text on every liquid glass control.
/// The user asked to keep the material identical and only soften the selected
/// blue (systemBlue is too saturated).
private let LIGHT_SELECTED_BLUE = UIColor(red: 0.31, green: 0.66, blue: 1.0, alpha: 1.0)

/**
 A standard UIKit UIButton. On iOS 26 and later it uses Apple's own
 UIButton.Configuration.glass(), with no background, tint, blur, or animation
 supplied by the app.
 */
public final class NativeLiquidButtonView: ExpoView {
  let onPress = EventDispatcher()
  private let button = UIButton(type: .system)

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    button.translatesAutoresizingMaskIntoConstraints = false
    button.contentHorizontalAlignment = .center
    button.contentVerticalAlignment = .center
    button.addTarget(self, action: #selector(didPress), for: .touchUpInside)
    addSubview(button)
    NSLayoutConstraint.activate([
      button.leadingAnchor.constraint(equalTo: leadingAnchor),
      button.trailingAnchor.constraint(equalTo: trailingAnchor),
      button.topAnchor.constraint(equalTo: topAnchor),
      button.bottomAnchor.constraint(equalTo: bottomAnchor),
    ])
    refreshConfiguration()
  }

  private var title = ""
  private var systemImage: String?
  private var isControlDisabled = false
  private var isControlSelected = false
  private var fontSize: Double?

  func setTitle(_ value: String) {
    title = value
    refreshConfiguration()
  }

  func setSystemImage(_ value: String?) {
    systemImage = value
    refreshConfiguration()
  }

  func setDisabled(_ value: Bool) {
    isControlDisabled = value
    button.isEnabled = !value
  }

  func setSelected(_ value: Bool) {
    isControlSelected = value
    button.isSelected = value
  }

  func setFontSize(_ value: Double?) {
    fontSize = value
    refreshConfiguration()
  }

  private func refreshConfiguration() {
    if #available(iOS 26.0, *) {
      var configuration = UIButton.Configuration.glass()
      configuration.title = title
      configuration.image = systemImage.flatMap(UIImage.init(systemName:))
      configuration.imagePadding = systemImage == nil ? 0 : 6
      if isControlSelected {
        configuration.baseForegroundColor = LIGHT_SELECTED_BLUE
      }
      configuration.titleLineBreakMode = .byTruncatingTail
      applyFontSize(to: &configuration)
      button.configuration = configuration
    } else {
      var configuration = UIButton.Configuration.bordered()
      configuration.title = title
      configuration.image = systemImage.flatMap(UIImage.init(systemName:))
      configuration.imagePadding = systemImage == nil ? 0 : 6
      if isControlSelected {
        configuration.baseForegroundColor = LIGHT_SELECTED_BLUE
      }
      configuration.titleLineBreakMode = .byTruncatingTail
      applyFontSize(to: &configuration)
      button.configuration = configuration
    }
    // Keep the title on one line; long labels scale down instead of wrapping
    // into a vertical-looking stack inside narrow glass buttons.
    button.titleLabel?.numberOfLines = 1
    button.titleLabel?.textAlignment = .center
    button.titleLabel?.adjustsFontSizeToFitWidth = true
    button.titleLabel?.minimumScaleFactor = 0.55
    button.titleLabel?.baselineAdjustment = .alignCenters
    button.isSelected = isControlSelected
    button.isEnabled = !isControlDisabled
  }

  private func applyFontSize(to configuration: inout UIButton.Configuration) {
    guard let fontSize else { return }
    configuration.titleTextAttributesTransformer = UIConfigurationTextAttributesTransformer { incoming in
      var outgoing = incoming
      outgoing.font = .systemFont(ofSize: fontSize, weight: .semibold)
      return outgoing
    }
  }

  @objc private func didPress() {
    onPress([:])
  }
}

/**
 A non-actionable page-title capsule rendered with Apple's own .glass()
 material. It looks exactly like the "修改" glass button but cannot be pressed.
 */
public final class NativeLiquidTitleView: ExpoView {
  private let button = UIButton(type: .system)
  private var title = ""

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    button.translatesAutoresizingMaskIntoConstraints = false
    button.isUserInteractionEnabled = false
    button.titleLabel?.numberOfLines = 1
    button.titleLabel?.textAlignment = .center
    button.titleLabel?.adjustsFontSizeToFitWidth = true
    button.titleLabel?.minimumScaleFactor = 0.7
    addSubview(button)
    NSLayoutConstraint.activate([
      button.leadingAnchor.constraint(equalTo: leadingAnchor),
      button.trailingAnchor.constraint(equalTo: trailingAnchor),
      button.topAnchor.constraint(equalTo: topAnchor),
      button.bottomAnchor.constraint(equalTo: bottomAnchor),
    ])
    refresh()
  }

  func setTitle(_ value: String) {
    title = value
    refresh()
  }

  private func refresh() {
    let textTransformer = UIConfigurationTextAttributesTransformer { incoming in
      var outgoing = incoming
      outgoing.font = .systemFont(ofSize: 16, weight: .semibold)
      return outgoing
    }
    if #available(iOS 26.0, *) {
      var configuration = UIButton.Configuration.glass()
      configuration.title = title
      configuration.titleTextAttributesTransformer = textTransformer
      button.configuration = configuration
    } else {
      var configuration = UIButton.Configuration.bordered()
      configuration.title = title
      configuration.titleTextAttributesTransformer = textTransformer
      button.configuration = configuration
    }
  }
}
/** A native glass segmented control built from Apple's UIKit glass buttons. */
public final class NativeLiquidSegmentedView: ExpoView, UIGestureRecognizerDelegate {
  let onSelectionChange = EventDispatcher()
  private let stack = UIStackView()
  private var buttons: [UIButton] = []
  private var options: [String] = []
  private var selectedIndex = 0
  private var isControlDisabled = false

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    stack.translatesAutoresizingMaskIntoConstraints = false
    stack.axis = .horizontal
    stack.alignment = .fill
    stack.distribution = .fillEqually
    stack.spacing = 4
    addSubview(stack)
    NSLayoutConstraint.activate([
      stack.leadingAnchor.constraint(equalTo: leadingAnchor),
      stack.trailingAnchor.constraint(equalTo: trailingAnchor),
      stack.topAnchor.constraint(equalTo: topAnchor),
      stack.bottomAnchor.constraint(equalTo: bottomAnchor),
    ])
    let pan = UIPanGestureRecognizer(target: self, action: #selector(handlePan(_:)))
    pan.maximumNumberOfTouches = 1
    pan.delegate = self
    addGestureRecognizer(pan)
  }

  func setOptions(_ values: [String]) {
    options = values
    buttons.forEach { $0.removeFromSuperview() }
    buttons.removeAll(keepingCapacity: true)
    for (index, value) in values.enumerated() {
      let button = UIButton(type: .system)
      button.tag = index
      button.titleLabel?.font = .preferredFont(forTextStyle: .subheadline)
      button.addTarget(self, action: #selector(selectionChanged(_:)), for: .touchUpInside)
      if #available(iOS 26.0, *) {
        var configuration = UIButton.Configuration.glass()
        configuration.title = value
        configuration.contentInsets = NSDirectionalEdgeInsets(top: 5, leading: 8, bottom: 5, trailing: 8)
        configuration.titleLineBreakMode = .byTruncatingTail
        button.configuration = configuration
      } else {
        var configuration = UIButton.Configuration.bordered()
        configuration.title = value
        configuration.contentInsets = NSDirectionalEdgeInsets(top: 5, leading: 8, bottom: 5, trailing: 8)
        configuration.titleLineBreakMode = .byTruncatingTail
        button.configuration = configuration
      }
      button.titleLabel?.numberOfLines = 1
      button.titleLabel?.adjustsFontSizeToFitWidth = true
      button.titleLabel?.minimumScaleFactor = 0.6
      // Match the bottom bar: selected text uses the system tab tint, idle
      // text uses the system secondary label color, and the glass material
      // stays identical to the native tab bar.
      button.configurationUpdateHandler = { button in
        var configuration = button.configuration
        if configuration == nil {
          if #available(iOS 26.0, *) {
            configuration = UIButton.Configuration.glass()
          } else {
            configuration = UIButton.Configuration.bordered()
          }
        }
        guard var configuration else { return }
        configuration.baseForegroundColor = button.isSelected ? LIGHT_SELECTED_BLUE : .systemGray
        button.configuration = configuration
      }
      buttons.append(button)
      stack.addArrangedSubview(button)
    }
    selectedIndex = values.isEmpty ? 0 : min(max(selectedIndex, 0), values.count - 1)
    applySelection()
  }

  func setSelectedIndex(_ value: Int) {
    selectedIndex = options.isEmpty ? 0 : min(max(0, value), options.count - 1)
    applySelection()
  }

  func setDisabled(_ value: Bool) {
    isControlDisabled = value
    buttons.forEach { $0.isEnabled = !value }
  }

  private func applySelection() {
    buttons.forEach { $0.isSelected = $0.tag == selectedIndex; $0.isEnabled = !isControlDisabled }
  }

  @objc private func selectionChanged(_ sender: UIButton) {
    let index = sender.tag
    guard options.indices.contains(index) else { return }
    selectedIndex = index
    applySelection()
    onSelectionChange(["value": options[index]])
  }

  // Dragging across the control switches selection just like the native tab
  // bar, so the gender/calendar rows behave like the bottom bar.
  @objc private func handlePan(_ gesture: UIPanGestureRecognizer) {
    guard !options.isEmpty, !isControlDisabled else { return }
    let width = bounds.width > 0 ? bounds.width : 1
    let segmentWidth = width / CGFloat(options.count)
    let index = min(max(0, Int(gesture.location(in: self).x / segmentWidth)), options.count - 1)
    if index != selectedIndex {
      selectedIndex = index
      applySelection()
      onSelectionChange(["value": options[index]])
    }
  }

  public override func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
    guard let pan = gestureRecognizer as? UIPanGestureRecognizer else { return true }
    let velocity = pan.velocity(in: self)
    return abs(velocity.x) > abs(velocity.y) * 1.3
  }
}

/**
 A fixed-size Liquid Glass tab bar built from three joined UIKit .glass()
 buttons. UITabBar's floating pill on iOS 26 draws with system margins, which
 made the native bar look smaller than the React Native frame; three glass
 buttons fill the frame exactly while keeping Apple's own Liquid Glass
 material. Only the selected tint color is customized.
 */
public final class NativeLiquidTabBarView: ExpoView {
  let onSelectionChange = EventDispatcher()
  private let stack = UIStackView()
  private var buttons: [UIButton] = []
  private let tabs: [(id: String, title: String, symbol: String)] = [
    ("input", "\u{6392}\u{76D8}", "square.and.pencil"),
    ("archive", "\u{6863}\u{6848}\u{5E93}", "folder"),
    ("settings", "\u{8BBE}\u{7F6E}", "gearshape"),
  ]

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    stack.translatesAutoresizingMaskIntoConstraints = false
    stack.axis = .horizontal
    stack.alignment = .fill
    stack.distribution = .fillEqually
    stack.spacing = 4
    addSubview(stack)
    NSLayoutConstraint.activate([
      stack.leadingAnchor.constraint(equalTo: leadingAnchor),
      stack.trailingAnchor.constraint(equalTo: trailingAnchor),
      stack.topAnchor.constraint(equalTo: topAnchor),
      stack.bottomAnchor.constraint(equalTo: bottomAnchor),
    ])
    for (index, tab) in tabs.enumerated() {
      let button = UIButton(type: .system)
      button.tag = index
      button.accessibilityTraits = [.button]
      button.addTarget(self, action: #selector(selectionChanged(_:)), for: .touchUpInside)
      if #available(iOS 26.0, *) {
        var configuration = UIButton.Configuration.glass()
        configuration.title = tab.title
        configuration.image = UIImage(systemName: tab.symbol)
        configuration.imagePlacement = .top
        configuration.imagePadding = 2
        configuration.preferredSymbolConfigurationForImage = UIImage.SymbolConfiguration(pointSize: 17, weight: .medium)
        configuration.titleTextAttributesTransformer = UIConfigurationTextAttributesTransformer { incoming in
          var outgoing = incoming
          outgoing.font = .systemFont(ofSize: 11, weight: .semibold)
          return outgoing
        }
        button.configuration = configuration
      } else {
        var configuration = UIButton.Configuration.bordered()
        configuration.title = tab.title
        configuration.image = UIImage(systemName: tab.symbol)
        configuration.imagePlacement = .top
        configuration.imagePadding = 2
        configuration.preferredSymbolConfigurationForImage = UIImage.SymbolConfiguration(pointSize: 17, weight: .medium)
        configuration.titleTextAttributesTransformer = UIConfigurationTextAttributesTransformer { incoming in
          var outgoing = incoming
          outgoing.font = .systemFont(ofSize: 11, weight: .semibold)
          return outgoing
        }
        button.configuration = configuration
      }
      button.configurationUpdateHandler = { button in
        var configuration = button.configuration
        if configuration == nil {
          if #available(iOS 26.0, *) {
            configuration = UIButton.Configuration.glass()
          } else {
            configuration = UIButton.Configuration.bordered()
          }
        }
        guard var configuration else { return }
        configuration.baseForegroundColor = button.isSelected ? LIGHT_SELECTED_BLUE : .systemGray
        button.configuration = configuration
      }
      buttons.append(button)
      stack.addArrangedSubview(button)
    }
  }

  public override var intrinsicContentSize: CGSize {
    CGSize(width: UIView.noIntrinsicMetric, height: UIView.noIntrinsicMetric)
  }

  func setSelectedTab(_ value: String) {
    guard let index = tabs.firstIndex(where: { $0.id == value }) else { return }
    for (i, button) in buttons.enumerated() {
      button.isSelected = (i == index)
      button.accessibilityTraits = i == index ? [.button, .selected] : [.button]
    }
  }

  @objc private func selectionChanged(_ sender: UIButton) {
    guard tabs.indices.contains(sender.tag) else { return }
    setSelectedTab(tabs[sender.tag].id)
    onSelectionChange(["value": tabs[sender.tag].id])
  }
}

/**
 A fixed-size inline Liquid Glass selector (gender, calendar type, and every
 segmented row). It is built from joined UIKit .glass() buttons that fill the
 React Native frame exactly, with the same slide-to-change gesture as the
 bottom bar and the same selected light-blue tint.
 */
public final class NativeLiquidSelectorView: ExpoView, UIGestureRecognizerDelegate {
  let onSelectionChange = EventDispatcher()
  private let stack = UIStackView()
  private var buttons: [UIButton] = []
  private var options: [String] = []
  private var selectedIndex = 0
  private var isControlDisabled = false

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    stack.translatesAutoresizingMaskIntoConstraints = false
    stack.axis = .horizontal
    stack.alignment = .fill
    stack.distribution = .fillEqually
    stack.spacing = 4
    addSubview(stack)
    NSLayoutConstraint.activate([
      stack.leadingAnchor.constraint(equalTo: leadingAnchor),
      stack.trailingAnchor.constraint(equalTo: trailingAnchor),
      stack.topAnchor.constraint(equalTo: topAnchor),
      stack.bottomAnchor.constraint(equalTo: bottomAnchor),
    ])
    let pan = UIPanGestureRecognizer(target: self, action: #selector(handlePan(_:)))
    pan.maximumNumberOfTouches = 1
    pan.delegate = self
    addGestureRecognizer(pan)
  }

  public override var intrinsicContentSize: CGSize {
    CGSize(width: UIView.noIntrinsicMetric, height: UIView.noIntrinsicMetric)
  }

  func setOptions(_ values: [String]) {
    options = values
    buttons.forEach { $0.removeFromSuperview() }
    buttons.removeAll(keepingCapacity: true)
    for (index, value) in values.enumerated() {
      let button = UIButton(type: .system)
      button.tag = index
      button.accessibilityTraits = [.button]
      button.addTarget(self, action: #selector(selectionChanged(_:)), for: .touchUpInside)
      if #available(iOS 26.0, *) {
        var configuration = UIButton.Configuration.glass()
        configuration.title = value
        configuration.titleTextAttributesTransformer = UIConfigurationTextAttributesTransformer { incoming in
          var outgoing = incoming
          outgoing.font = .systemFont(ofSize: 17, weight: .semibold)
          return outgoing
        }
        button.configuration = configuration
      } else {
        var configuration = UIButton.Configuration.bordered()
        configuration.title = value
        configuration.titleTextAttributesTransformer = UIConfigurationTextAttributesTransformer { incoming in
          var outgoing = incoming
          outgoing.font = .systemFont(ofSize: 17, weight: .semibold)
          return outgoing
        }
        button.configuration = configuration
      }
      button.configurationUpdateHandler = { button in
        var configuration = button.configuration
        if configuration == nil {
          if #available(iOS 26.0, *) {
            configuration = UIButton.Configuration.glass()
          } else {
            configuration = UIButton.Configuration.bordered()
          }
        }
        guard var configuration else { return }
        configuration.baseForegroundColor = button.isSelected ? LIGHT_SELECTED_BLUE : .systemGray
        button.configuration = configuration
      }
      buttons.append(button)
      stack.addArrangedSubview(button)
    }
    selectedIndex = options.isEmpty ? 0 : min(max(selectedIndex, 0), options.count - 1)
    applySelection()
  }

  func setSelectedIndex(_ value: Int) {
    selectedIndex = options.isEmpty ? 0 : min(max(0, value), options.count - 1)
    applySelection()
  }

  func setDisabled(_ value: Bool) {
    isControlDisabled = value
    buttons.forEach { $0.isEnabled = !value }
  }

  private func applySelection() {
    for button in buttons {
      button.isSelected = button.tag == selectedIndex
      button.accessibilityTraits = button.isSelected ? [.button, .selected] : [.button]
    }
  }

  @objc private func selectionChanged(_ sender: UIButton) {
    guard options.indices.contains(sender.tag) else { return }
    selectedIndex = sender.tag
    applySelection()
    onSelectionChange(["value": options[selectedIndex]])
  }

  @objc private func handlePan(_ gesture: UIPanGestureRecognizer) {
    guard !options.isEmpty, !isControlDisabled else { return }
    let width = bounds.width > 0 ? bounds.width : 1
    let segmentWidth = width / CGFloat(options.count)
    let index = min(max(0, Int(gesture.location(in: self).x / segmentWidth)), options.count - 1)
    if index != selectedIndex {
      selectedIndex = index
      applySelection()
      onSelectionChange(["value": options[index]])
    }
  }

  public override func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
    guard let pan = gestureRecognizer as? UIPanGestureRecognizer else { return true }
    let velocity = pan.velocity(in: self)
    return abs(velocity.x) > abs(velocity.y) * 1.3
  }
}

public final class NativeLiquidButtonModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NativeLiquidButton")
    View(NativeLiquidButtonView.self) {
      Prop("title") { (view, value: String) in view.setTitle(value) }
      Prop("systemImage") { (view, value: String?) in view.setSystemImage(value) }
      Prop("disabled", false) { (view, value: Bool) in view.setDisabled(value) }
      Prop("selected", false) { (view, value: Bool) in view.setSelected(value) }
      Prop("fontSize") { (view, value: Double?) in view.setFontSize(value) }
      Events("onPress")
    }
  }
}

public final class NativeLiquidTitleModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NativeLiquidTitle")
    View(NativeLiquidTitleView.self) {
      Prop("title") { (view, value: String) in view.setTitle(value) }
    }
  }
}

public final class NativeLiquidSegmentedModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NativeLiquidSegmented")
    View(NativeLiquidSegmentedView.self) {
      Prop("options") { (view, value: [String]) in view.setOptions(value) }
      Prop("selectedIndex") { (view, value: Int) in view.setSelectedIndex(value) }
      Prop("disabled", false) { (view, value: Bool) in view.setDisabled(value) }
      Events("onSelectionChange")
    }
  }
}

public final class NativeLiquidTabBarModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NativeLiquidTabBar")
    View(NativeLiquidTabBarView.self) {
      Prop("selectedTab") { (view, value: String) in view.setSelectedTab(value) }
      Events("onSelectionChange")
    }
  }
}

public final class NativeLiquidSelectorModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NativeLiquidSelector")
    View(NativeLiquidSelectorView.self) {
      Prop("options") { (view, value: [String]) in view.setOptions(value) }
      Prop("selectedIndex") { (view, value: Int) in view.setSelectedIndex(value) }
      Prop("disabled", false) { (view, value: Bool) in view.setDisabled(value) }
      Events("onSelectionChange")
    }
  }
}
