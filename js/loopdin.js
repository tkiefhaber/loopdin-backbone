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
      newProject.save(null, {
        success: function(newProject) {
          alert(newProject.get("title") + ' has been created');
        },
        error: function(newProject, error) {
          alert(newProject.get("title") + ' failed to save because ' + error.description);
        }
      });
    },
  });

  var AppState = Parse.Object.extend("AppState", {
    defaults: {
      filter: "all"
    }
  });

  var ProjectsList = Parse.Collection.extend({

    model: Project,

    active: function() {
      var query = new Parse.Query(Project);
      query.equalTo("user", Parse.User.current());
      query.equalTo("status", "active");
    },

    submitted: function() {
      var query = new Parse.Query(Project);
      query.equalTo("user", Parse.User.current());
      query.equalTo("status", "submitted");
    },

    approved: function() {
      var query = new Parse.Query(Project);
      query.equalTo("user", Parse.User.current());
      query.equalTo("status", "approved");
    },

  });

  var ManageProjectsView = Parse.View.extend({
    el: ".content",

    events: {
      "click .log-out": "logOut",
    },

    initialize: function() {
      _.bindAll(this, "logOut");
      this.render();
    },

    logOut: function(e) {
      Parse.User.logOut();
      new LogInView();
      this.undelegateEvents();
      delete this;
    },

    render: function() {
      this.$el.html(_.template($("#manage-projects-template").html()));
      this.delegateEvents();
    }
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

  new AppView;

});
