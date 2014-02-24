$(function() {

  Parse.$ = jQuery;

  Parse.initialize("21T2F3tXhktZ9FRoqWEL9XYmKX7H1Ekefts5dnAo",
                   "SmnAnMQWMdJKAPofbIswn1qLEzk3CQ00k3y8g22h");


  var Project = Parse.Object.extend("Project", {
    defaults: {
      title: "new project",
      description: "just getting started",
      status: 'active',
      user: Parse.User.current()
    },

    initialize: function() {
      newProject = this
      if (!newProject.get("title")) {
        newProject.set({"title": newProject.defaults.title});
      }
      if (!newProject.get("description")) {
        newProject.set({"description": newProject.defaults.description});
      }
      if (!newProject.get("status")) {
        newProject.set({"status": newProject.defaults.status});
      }
      newProject.set({"user": Parse.User.current()});
    },
  });

  var AppState = Parse.Object.extend("AppState", {
    defaults: {
      filter: "all"
    }
  });

  var ProjectsList = Parse.Collection.extend({
    model: Project,

    all: function() {
      var query = new Parse.Query(Project);
      return query.equalTo("user", Parse.User.current());
    },

    active: function() {
      var query = new Parse.Query(Project);
      query.equalTo("user", Parse.User.current());
      return query.equalTo("status", "active");
    },

    submitted: function() {
      var query = new Parse.Query(Project);
      query.equalTo("user", Parse.User.current());
      return query.equalTo("status", "submitted");
    },

    approved: function() {
      var query = new Parse.Query(Project);
      query.equalTo("user", Parse.User.current());
      return query.equalTo("status", "approved");
    },

  });

  var ManageProjectsView = Parse.View.extend({
    el: ".content",

    events: {
      "click .log-out": "logOut",
      "submit form.new-project-form": "createProject",
    },

    initialize: function() {
      this.projects = new ProjectsList;
      this.projects.query = new Parse.Query(Project);
      this.projects.query.equalTo("user", Parse.User.current());
      _.bindAll(this, "logOut", "createProject", "addOne", "addAll");
      this.render();
    },

    logOut: function() {
      Parse.User.logOut();
      new LogInView();
      this.undelegateEvents();
      delete this;
    },

    addOne: function(project) {
      var view = new ProjectView({model: project});
      this.$("#project-list").append(view.render().el);
    },

    addAll: function(collection, filter) {
      this.$("#project-list").html("");
      this.projects.each(this.addOne);
    },

    createProject: function() {
      var self = this;
      console.log(this);

      this.projects.create({
        title:       this.$("#new-project-title").val(),
        description: this.$("#new-project-description").val(),
      });

    },

    render: function() {
      this.$el.html(_.template($("#manage-projects-template").html()));
      this.addAll();
      this.delegateEvents();
    }
  });

  var ProjectView = Parse.View.extend({
    tagName: "li",

    template: _.template($('#project-template').html()),

    initialize: function() {
      _.bindAll(this, 'render');
    },

    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      this.input = this.$('.edit');
      return this;
    },
  });

  var LogInView = Parse.View.extend({
    events: {
      "submit form.login-form": "logIn",
      "click .sign-up": "signUp"
    },

    el: ".content",

    initialize: function() {
      _.bindAll(this, "logIn", "signUp");
      this.render();
    },

    logIn: function(e) {
      var self = this;
      var username = this.$("#login-username").val();
      var password = this.$("#login-password").val();

      Parse.User.logIn(username, password, {
        success: function(user) {
          new ManageProjectsView();
          self.undelegateEvents();
          delete self;
        },

        error: function(user, error) {
          self.$(".login-form .error").html("Invalid username or password. Please try again.").show();
          this.$(".login-form button").removeAttr("disabled");
        }
      });

      this.$(".login-form button").attr("disabled", "disabled");

      return false;
    },

    signUp: function() {
      new SignUpView();
    },

    render: function() {
      this.$el.html(_.template($("#login-template").html()));
      this.delegateEvents();
    }
  });

  var SignUpView = Parse.View.extend({
    events: {
      "submit form.signup-form": "signUp",
      "click .log-in": "logIn"
    },

    el: ".content",

    initialize: function() {
      _.bindAll(this, "signUp");
      this.render();
    },

    signUp: function(e) {
      var self = this;
      var username = this.$("#signup-username").val();
      var password = this.$("#signup-password").val();

      Parse.User.signUp(username, password, { ACL: new Parse.ACL() }, {
        success: function(user) {
          new ManageProjectsView();
          self.undelegateEvents();
          delete self;
        },

        error: function(user, error) {
          self.$(".signup-form .error").html(error.message).show();
          this.$(".signup-form button").removeAttr("disabled");
        }
      });

      this.$(".signup-form button").attr("disabled", "disabled");

      return false;
    },

    logIn: function() {
      new LogInView();
    },

    render: function() {
      this.$el.html(_.template($("#signup-template").html()));
      this.delegateEvents();
    }
  });

  var AppView = Parse.View.extend({
    el: $("#loopdinapp"),

    initialize: function() {
      this.render();
    },

    render: function() {
      if (Parse.User.current()) {
        new ManageProjectsView();
      } else {
        new LogInView();
      }
    }
  });

  var AppRouter = Parse.Router.extend({
    routes: {
      "all": "all",
      "active": "active",
      "submitted": "submitted"
    },

    initialize: function(options) {
    },

    all: function() {
      state.set({ filter: "all" });
    },

    active: function() {
      state.set({ filter: "active" });
    },

    submitted: function() {
      state.set({ filter: "submitted" });
    },

    approved: function() {
      state.set({ filter: "approved" });
    }
  });

  var state = new AppState;

  new AppRouter;

  var state = new AppState
  new AppView;

});
