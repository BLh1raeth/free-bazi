import ExpoModulesCore
import UIKit

/// Shared selected-text color (#6D87B5) on every liquid glass control.
private let SELECTED_TEXT = UIColor(red: 0.43, green: 0.53, blue: 0.71, alpha: 1.0)
/// Unified label color (#15366F) used for every glass-button inner text so the
/// typography matches the form labels ("姓名", "性别").
private let LABEL_TEXT_COLOR = UIColor(red: 0.08, green: 0.21, blue: 0.44, alpha: 1.0)

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
    let baseSize = button.titleLabel?.font.pointSize ?? 15
    let boldTransformer = UIConfigurationTextAttributesTransformer { incoming in
      var outgoing = incoming
      outgoing.font = .systemFont(ofSize: baseSize, weight: .bold)
      return outgoing
    }
    if #available(iOS 26.0, *) {
      var configuration = UIButton.Configuration.glass()
      configuration.title = title
      configuration.image = systemImage.flatMap(UIImage.init(systemName:))
      configuration.imagePadding = systemImage == nil ? 0 : 6
      configuration.baseForegroundColor = LABEL_TEXT_COLOR
      configuration.titleTextAttributesTransformer = boldTransformer
      if isControlSelected {
        configuration.baseForegroundColor = SELECTED_TEXT
        configuration.background.backgroundColor = UIColor(white: 0.76, alpha: 0.5)
      } else {
        configuration.background.backgroundColor = .clear
      }
      configuration.titleLineBreakMode = .byTruncatingTail
      applyFontSize(to: &configuration)
      button.configuration = configuration
    } else {
      var configuration = UIButton.Configuration.bordered()
      configuration.title = title
      configuration.image = systemImage.flatMap(UIImage.init(systemName:))
      configuration.imagePadding = systemImage == nil ? 0 : 6
      configuration.baseForegroundColor = LABEL_TEXT_COLOR
      configuration.titleTextAttributesTransformer = boldTransformer
      if isControlSelected {
        configuration.baseForegroundColor = SELECTED_TEXT
        configuration.background.backgroundColor = UIColor(white: 0.76, alpha: 0.5)
      } else {
        configuration.background.backgroundColor = .clear
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
      outgoing.font = .systemFont(ofSize: fontSize, weight: .bold)
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

  // Report the button's natural size (title + system content insets) so the
  // React Native capsule hugs the text instead of stretching to a fixed width.
  public override var intrinsicContentSize: CGSize {
    button.intrinsicContentSize
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
      configuration.baseForegroundColor = LABEL_TEXT_COLOR
      configuration.titleTextAttributesTransformer = textTransformer
      configuration.titleLineBreakMode = .byTruncatingTail
      button.configuration = configuration
    } else {
      var configuration = UIButton.Configuration.bordered()
      configuration.title = title
      configuration.baseForegroundColor = LABEL_TEXT_COLOR
      configuration.titleTextAttributesTransformer = textTransformer
      configuration.titleLineBreakMode = .byTruncatingTail
      button.configuration = configuration
    }
  }
}

/**
 A Liquid Glass panel backed by UIGlassEffect. Unlike expo-glass-effect's
 GlassView, the material is re-applied every time the view re-enters the
 window. React Native can recycle native views across unmount/remount (for
 example when switching 原盘/细盘), and the recycled view otherwise keeps a
 stale "already mounted" flag with no glass material at all.
 */
public final class NativeGlassPanelView: ExpoView {
  private let glassEffectView = UIVisualEffectView()
  private var pendingStyle: UIGlassEffect.Style? = .regular
  private var pendingTint: UIColor? = nil
  private var pendingInteractive = false
  private var lastAppliedStyle: UIGlassEffect.Style?
  private var lastAppliedTint: UIColor?
  private var lastAppliedInteractive: Bool?

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    glassEffectView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    glassEffectView.frame = bounds
    addSubview(glassEffectView)
  }

  private func isGlassAvailable() -> Bool {
    #if compiler(>=6.2)
    if #available(iOS 26.0, tvOS 26.0, macOS 26.0, *) {
      guard let glassEffectClass = NSClassFromString("UIGlassEffect") as? NSObject.Type else {
        return false
      }
      return glassEffectClass.responds(to: Selector(("effectWithStyle:")))
    }
    #endif
    return false
  }

  private func applyMaterial() {
    guard window != nil, isGlassAvailable() else { return }
    #if compiler(>=6.2)
    if #available(iOS 26.0, tvOS 26.0, macOS 26.0, *) {
      guard let style = pendingStyle else { return }
      if lastAppliedStyle == style && lastAppliedTint == pendingTint && lastAppliedInteractive == pendingInteractive {
        return
      }
      let glass = UIGlassEffect(style: style)
      glass.tintColor = pendingTint
      glass.isInteractive = pendingInteractive
      glassEffectView.effect = glass
      lastAppliedStyle = style
      lastAppliedTint = pendingTint
      lastAppliedInteractive = pendingInteractive
      applyCornerRadius()
    }
    #endif
  }

  private func applyCornerRadius() {
    #if compiler(>=6.2)
    if #available(iOS 26.0, tvOS 26.0, macOS 26.0, *) {
      let radius = layer.cornerRadius
      if radius > 0 {
        let corner = UICornerRadius(floatLiteral: radius)
        glassEffectView.cornerConfiguration = .corners(
          topLeftRadius: corner,
          topRightRadius: corner,
          bottomLeftRadius: corner,
          bottomRightRadius: corner
        )
      }
    }
    #endif
  }

  public override func layoutSubviews() {
    super.layoutSubviews()
    glassEffectView.frame = bounds
    applyMaterial()
    applyCornerRadius()
  }

  public override func didMoveToWindow() {
    super.didMoveToWindow()
    applyMaterial()
  }

  func setGlassStyle(_ value: String) {
    pendingStyle = value == "clear" ? .clear : .regular
    lastAppliedStyle = nil
    applyMaterial()
  }

  func setTintColor(_ value: UIColor?) {
    pendingTint = value
    lastAppliedTint = nil
    applyMaterial()
  }

  func setInteractive(_ value: Bool) {
    pendingInteractive = value
    lastAppliedInteractive = nil
    applyMaterial()
  }

  public override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
    glassEffectView.contentView.insertSubview(childComponentView, at: index)
  }

  public override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {
    childComponentView.removeFromSuperview()
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
        configuration.baseForegroundColor = button.isSelected ? SELECTED_TEXT : LABEL_TEXT_COLOR
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
 A native UITabBar; UIKit owns the iOS 26 Liquid Glass floating material,
 animation, and accessibility. On iOS 26 the system draws the bar as a
 floating capsule with its own margins, so the host view is sized to a normal
 tab bar height instead of being stretched. Only the selected tint color is
 customized; no background customization is applied (that would break glass).
 */
public final class NativeLiquidTabBarView: ExpoView, UITabBarDelegate {
  let onSelectionChange = EventDispatcher()
  private let tabBar = UITabBar()
  private let tabs: [(id: String, title: String, symbol: String)] = [
    ("input", "\u{6392}\u{76D8}", "square.and.pencil"),
    ("archive", "\u{6863}\u{6848}\u{5E93}", "folder"),
    ("settings", "\u{8BBE}\u{7F6E}", "gearshape"),
  ]

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    tabBar.delegate = self
    // Selected text/icon tint only; every other tab bar property stays system.
    tabBar.tintColor = SELECTED_TEXT
    tabBar.unselectedItemTintColor = LABEL_TEXT_COLOR
    let icon = UIImage.SymbolConfiguration(pointSize: 20, weight: .medium)
    let titleFont = UIFont.systemFont(ofSize: 11, weight: .semibold)
    tabBar.items = tabs.enumerated().map { index, tab in
      let item = UITabBarItem(title: tab.title, image: UIImage(systemName: tab.symbol, withConfiguration: icon), tag: index)
      item.setTitleTextAttributes([.font: titleFont, .foregroundColor: LABEL_TEXT_COLOR], for: .normal)
      item.setTitleTextAttributes([.font: titleFont, .foregroundColor: SELECTED_TEXT], for: .selected)
      return item
    }
    // Apply tints after items are set so both states take effect reliably.
    tabBar.tintColor = SELECTED_TEXT
    tabBar.unselectedItemTintColor = LABEL_TEXT_COLOR
    addSubview(tabBar)
  }

  // UITabBar reports an intrinsic size (~320x49). Without this override the
  // host view can collapse to that size instead of filling the React Native
  // frame, which made the native glass bar smaller than the fallback bar.
  public override var intrinsicContentSize: CGSize {
    CGSize(width: UIView.noIntrinsicMetric, height: UIView.noIntrinsicMetric)
  }

  public override func layoutSubviews() {
    super.layoutSubviews()
    tabBar.frame = bounds
  }

  func setSelectedTab(_ value: String) {
    guard let index = tabs.firstIndex(where: { $0.id == value }) else { return }
    tabBar.selectedItem = tabBar.items?[index]
  }

  public func tabBar(_ tabBar: UITabBar, didSelect item: UITabBarItem) {
    guard tabs.indices.contains(item.tag) else { return }
    onSelectionChange(["value": tabs[item.tag].id])
  }
}

/**
 An inline single-choice selector (gender, calendar type, chart modes,
 archive sort, day boundary). It uses the exact same UIKit UITabBar class as
 the bottom bar, so the material is identical: a transparent Liquid Glass
 pill with no gray backing. Auto Layout pins the bar to the host frame, the
 selected item keeps the shared light-blue tint, and a horizontal pan lets
 users slide between items like the bottom bar.
 */
public final class NativeLiquidSelectorView: ExpoView, UITabBarDelegate, UIGestureRecognizerDelegate {
  let onSelectionChange = EventDispatcher()
  private let tabBar = UITabBar()
  private var options: [String] = []
  private var selectedIndex = 0
  private var isControlDisabled = false
  private var titleOffsetY: CGFloat = 0

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    tabBar.delegate = self
    tabBar.itemPositioning = .centered
    tabBar.tintColor = SELECTED_TEXT
    tabBar.translatesAutoresizingMaskIntoConstraints = false
    addSubview(tabBar)
    NSLayoutConstraint.activate([
      tabBar.leadingAnchor.constraint(equalTo: leadingAnchor),
      tabBar.trailingAnchor.constraint(equalTo: trailingAnchor),
      tabBar.topAnchor.constraint(equalTo: topAnchor),
      tabBar.bottomAnchor.constraint(equalTo: bottomAnchor),
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
    let font = UIFont.systemFont(ofSize: 16, weight: .bold)
    let normal: [NSAttributedString.Key: Any] = [.font: font, .foregroundColor: LABEL_TEXT_COLOR, .baselineOffset: titleOffsetY]
    let selected: [NSAttributedString.Key: Any] = [.font: font, .foregroundColor: SELECTED_TEXT, .baselineOffset: titleOffsetY]
    tabBar.items = values.enumerated().map { index, title in
      let item = UITabBarItem(title: title, image: nil, tag: index)
      item.setTitleTextAttributes(normal, for: .normal)
      item.setTitleTextAttributes(selected, for: .selected)
      return item
    }
    selectedIndex = options.isEmpty ? 0 : min(max(selectedIndex, 0), options.count - 1)
    tabBar.selectedItem = tabBar.items?[selectedIndex]
  }

  func setTitleOffsetY(_ value: Double) {
    titleOffsetY = CGFloat(value)
    if !options.isEmpty { setOptions(options) }
  }

  func setSelectedIndex(_ value: Int) {
    selectedIndex = options.isEmpty ? 0 : min(max(0, value), options.count - 1)
    tabBar.selectedItem = tabBar.items?[selectedIndex]
  }

  func setDisabled(_ value: Bool) {
    isControlDisabled = value
  }

  public func tabBar(_ tabBar: UITabBar, didSelect item: UITabBarItem) {
    guard options.indices.contains(item.tag) else { return }
    selectedIndex = item.tag
    onSelectionChange(["value": options[item.tag]])
  }

  @objc private func handlePan(_ gesture: UIPanGestureRecognizer) {
    guard !options.isEmpty, !isControlDisabled else { return }
    let width = bounds.width > 0 ? bounds.width : 1
    let segmentWidth = width / CGFloat(options.count)
    let index = min(max(0, Int(gesture.location(in: self).x / segmentWidth)), options.count - 1)
    if index != selectedIndex {
      selectedIndex = index
      tabBar.selectedItem = tabBar.items?[index]
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

public final class NativeGlassPanelModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NativeGlassPanel")
    View(NativeGlassPanelView.self) {
      Prop("glassStyle") { (view, value: String) in view.setGlassStyle(value) }
      Prop("tintColor") { (view, value: UIColor?) in view.setTintColor(value) }
      Prop("interactive", false) { (view, value: Bool) in view.setInteractive(value) }
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
      Prop("titleOffsetY", 0.0) { (view, value: Double) in view.setTitleOffsetY(value) }
      Events("onSelectionChange")
    }
  }
}
